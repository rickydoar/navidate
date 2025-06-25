import OpenAI from 'openai'
import { DatePreferences, Venue, DateActivity } from '@/types'
import { googlePlaces } from './google-places'

interface DatePlanStructure {
  theme: string
  description: string
  flow: {
    phase: string
    duration: number
    vibe: string
    activityType: string
    requirements?: string[]
  }[]
  totalBudget: {
    min: number
    max: number
  }
}

export class DatePlannerService {
  private openai: OpenAI

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey })
  }

  /**
   * Generate a date plan structure using GPT-4
   */
  async generateDateStructure(preferences: DatePreferences): Promise<DatePlanStructure> {
    const prompt = this.createStructurePrompt(preferences)

    const completion = await this.openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `You are an expert date planner who creates creative date structures and flows. 
          You focus on the experience, timing, and transitions between activities. 
          You DO NOT suggest specific venue names - instead, you describe the type of venue and atmosphere needed.
          You MUST respond with valid JSON only - no additional text, explanations, or formatting.`
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7, // Reduced for more consistent JSON
      max_tokens: 1000,
    })

    const response = completion.choices[0].message.content
    if (!response) throw new Error('No response from OpenAI')

    // Clean up the response to ensure it's valid JSON
    let cleanedResponse = response.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
    }
    if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
    }

    try {
      const parsed = JSON.parse(cleanedResponse)
      
      // Validate the structure has required fields
      if (!parsed.theme || !parsed.description || !parsed.flow || !Array.isArray(parsed.flow)) {
        throw new Error('Invalid structure format')
      }
      
      return parsed as DatePlanStructure
    } catch (error) {
      console.error('Failed to parse date structure:', error)
      console.error('Raw response:', response)
      
      // Return a fallback structure
      return {
        theme: `${preferences.dateType.charAt(0).toUpperCase() + preferences.dateType.slice(1)} Date Experience`,
        description: `A personalized ${preferences.dateType} date experience`,
        flow: [
          {
            phase: "Opening Activity",
            duration: Math.floor(preferences.duration * 0.4),
            vibe: "welcoming and engaging",
            activityType: preferences.dateType === 'romantic' ? 'restaurant' : 'activity'
          },
          {
            phase: "Main Experience", 
            duration: Math.floor(preferences.duration * 0.6),
            vibe: "memorable and enjoyable",
            activityType: preferences.dateType === 'cultural' ? 'cultural' : 'restaurant'
          }
        ],
        totalBudget: preferences.budget
      }
    }
  }

  /**
   * Find real venues that match the date structure
   */
  async findVenuesForStructure(
    structure: DatePlanStructure,
    preferences: DatePreferences
  ): Promise<DateActivity[]> {
    const activities: DateActivity[] = []
    const location = preferences.location.coordinates || 
      await this.geocodeLocation(preferences.location)
    const usedVenueIds = new Set<string>() // Track used venues to avoid duplicates

    let currentTime = this.getStartTime(preferences.timeOfDay)
    
    for (const phase of structure.flow) {
      // Calculate budget for this phase
      const phaseBudget = {
        min: Math.floor((phase.duration / preferences.duration) * preferences.budget.min),
        max: Math.floor((phase.duration / preferences.duration) * preferences.budget.max)
      }

      // Check if this is an experiential activity (not a venue-based activity)
      const isExperientialActivity = this.isExperientialActivity(phase.activityType, phase.phase)
      
      if (isExperientialActivity) {
        // Generate experiential activity using GPT-4 with real location context
        const experientialActivity = await this.generateExperientialActivity(
          phase,
          location,
          preferences,
          currentTime,
          phaseBudget
        )
        
        if (experientialActivity) {
          activities.push(experientialActivity)
          currentTime += phase.duration + 15
          console.log(`Generated experiential activity: ${experientialActivity.venue.name}`)
          continue
        }
      }

      // For venue-based activities, use Google Places
      const venues = await googlePlaces.searchVenuesForDate(
        location,
        this.mapPhaseToDateType(phase.activityType, preferences.dateType),
        phaseBudget,
        preferences.maxTravelDistance
      )

      // Filter venues based on requirements AND exclude already used venues
      let filteredVenues = this.filterVenuesByRequirements(
        venues,
        phase.requirements || [],
        preferences
      )

      // Remove already selected venues to ensure variety
      filteredVenues = filteredVenues.filter(venue => !usedVenueIds.has(venue.id))

      // If we have no unique venues, try a broader search
      if (filteredVenues.length === 0) {
        console.log(`No unique venues found for phase "${phase.phase}", trying broader search...`)
        
        // Try different venue types based on phase
        const fallbackTypes = this.getFallbackVenueTypes(phase.activityType)
        
        for (const fallbackType of fallbackTypes) {
          const broadVenues = await googlePlaces.searchVenuesForDate(
            location,
            fallbackType,
            phaseBudget,
            preferences.maxTravelDistance
          )
          
          const availableVenues = broadVenues.filter(venue => !usedVenueIds.has(venue.id))
          if (availableVenues.length > 0) {
            filteredVenues = availableVenues.slice(0, 5)
            break
          }
        }
      }

      if (filteredVenues.length > 0) {
        // Select venue with intelligent criteria
        let selectedVenue = filteredVenues[0]

        if (activities.length > 0) {
          const lastActivity = activities[activities.length - 1]
          
          const goodOptions = filteredVenues.filter(venue => {
            const distance = googlePlaces.calculateDistance(lastActivity.venue.coordinates, venue.coordinates)
            const isDifferentCategory = venue.category !== lastActivity.venue.category
            const isReasonableDistance = distance <= 3 // Within 3 miles
            const hasGoodRating = venue.rating >= 3.5
            
            return isDifferentCategory && (isReasonableDistance || hasGoodRating)
          })

          if (goodOptions.length > 0) {
            selectedVenue = goodOptions.sort((a, b) => b.rating - a.rating)[0]
          }
        }
        
        const activity: DateActivity = {
          id: `activity-${activities.length + 1}`,
          venue: selectedVenue,
          startTime: this.formatTime(currentTime),
          endTime: this.formatTime(currentTime + phase.duration),
          description: phase.phase,
          estimatedCost: Math.floor((phaseBudget.min + phaseBudget.max) / 2),
          notes: phase.vibe
        }

        activities.push(activity)
        usedVenueIds.add(selectedVenue.id)
        currentTime += phase.duration + 15
        
        console.log(`Selected venue for phase "${phase.phase}": ${selectedVenue.name} (${selectedVenue.category})`)
      } else {
        console.warn(`No suitable venues found for phase: ${phase.phase}`)
      }
    }

    // Calculate travel times between activities
    for (let i = 0; i < activities.length - 1; i++) {
      const distance = googlePlaces.calculateDistance(
        activities[i].venue.coordinates,
        activities[i + 1].venue.coordinates
      )
      activities[i].travelTimeToNext = Math.ceil(distance * 3)
    }

    return activities
  }

  /**
   * Generate creative descriptions for activities
   */
  async enhanceActivitiesWithDescriptions(
    activities: DateActivity[],
    structure: DatePlanStructure
  ): Promise<DateActivity[]> {
    try {
      const prompt = `Given this date theme: "${structure.theme}" and description: "${structure.description}",
      create engaging descriptions for each activity that tie into the overall date narrative.
      
      Activities:
      ${activities.map((a, i) => `${i + 1}. ${a.venue.name} - ${structure.flow[i]?.phase || 'Activity'}`).join('\n')}
      
      Return ONLY a valid JSON array of strings, one description for each activity. Example format:
      ["Description for activity 1", "Description for activity 2", "Description for activity 3"]
      
      Make each description romantic, engaging, and specific to the venue while maintaining the date's theme.`

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You create engaging, romantic descriptions for date activities. You MUST respond with valid JSON only - no additional text, explanations, or formatting. Just a JSON array of strings."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7, // Reduced temperature for more consistent JSON
        max_tokens: 800,
      })

      const responseContent = completion.choices[0].message.content?.trim() || '[]'
      
      // Clean up the response to ensure it's valid JSON
      let cleanedResponse = responseContent
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
      }
      
      let descriptions: string[]
      try {
        descriptions = JSON.parse(cleanedResponse)
        
        // Validate that it's an array of strings
        if (!Array.isArray(descriptions) || descriptions.some(d => typeof d !== 'string')) {
          throw new Error('Invalid format: expected array of strings')
        }
      } catch (parseError) {
        console.error('Failed to parse GPT-4 response for descriptions:', parseError)
        console.error('Raw response:', responseContent)
        
        // Fallback: create simple descriptions
        descriptions = activities.map((activity, index) => 
          `Enjoy ${structure.flow[index]?.phase.toLowerCase() || 'a wonderful time'} at ${activity.venue.name}`
        )
      }
      
      return activities.map((activity, index) => ({
        ...activity,
        description: descriptions[index] || activity.description
      }))
      
    } catch (error) {
      console.error('Error enhancing activity descriptions:', error)
      
      // Return activities with fallback descriptions
      return activities.map((activity, index) => ({
        ...activity,
        description: structure.flow[index]?.phase || activity.description
      }))
    }
  }

  private createStructurePrompt(preferences: DatePreferences): string {
    const duration = Math.floor(preferences.duration / 60)
    
    return `Create a date structure for a ${preferences.dateType} date that lasts ${duration} hours.
    
    Budget: $${preferences.budget.min}-${preferences.budget.max}
    Time of day: ${preferences.timeOfDay}
    Group size: ${preferences.groupSize} people
    ${preferences.dietaryRestrictions?.length ? `Dietary restrictions: ${preferences.dietaryRestrictions.join(', ')}` : ''}
    ${preferences.accessibilityNeeds?.length ? `Accessibility needs: ${preferences.accessibilityNeeds.join(', ')}` : ''}
    
    Create a JSON response with:
    - theme: A creative theme for the date
    - description: A brief, enticing description
    - flow: An array of 2-4 phases, each with:
      - phase: What's happening (e.g., "Intimate dinner", "Sunset stroll")
      - duration: Time in minutes
      - vibe: The atmosphere/mood
      - activityType: Type of venue needed (restaurant, bar, outdoor, activity, cultural, entertainment)
      - requirements: Special requirements (e.g., "outdoor seating", "live music")
    - totalBudget: Budget range
    
    IMPORTANT: Create diverse experiences with different activityTypes. Mix venue-based and experiential activities:
    
    VENUE-BASED ACTIVITIES (use Google Places):
    - restaurant: dining establishments
    - bar: bars, pubs, lounges
    - cultural: museums, galleries, theaters
    - entertainment: cinemas, bowling, arcades
    
    EXPERIENTIAL ACTIVITIES (real activities, not venues):
    - outdoor: walks, hikes, beach visits, park exploration
    - scenic: sunset viewing, photography walks, sightseeing
    - active: biking, jogging, outdoor sports
    
    For ${preferences.dateType} dates, prefer combinations like:
    - Romantic: outdoor walk + restaurant + bar
    - Active: bike ride + casual restaurant + activity
    - Cultural: museum + restaurant + scenic walk
    - Adventurous: outdoor activity + restaurant + entertainment
    
    Ensure variety - don't repeat the same activityType. Make the flow natural with good transitions.`
  }

  private async geocodeLocation(location: DatePreferences['location']): Promise<{ lat: number; lng: number }> {
    // If we already have coordinates, use them
    if (location.coordinates) {
      return location.coordinates
    }

    // Otherwise, geocode the address or city
    const address = location.address || `${location.city}, ${location.state || ''} ${location.country || ''}`
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${process.env.GOOGLE_PLACES_API_KEY}`
    
    const response = await fetch(url)
    const data = await response.json()
    
    if (data.results && data.results.length > 0) {
      return data.results[0].geometry.location
    }
    
    // Default fallback
    return { lat: 40.7128, lng: -74.0060 } // NYC
  }

  private getStartTime(timeOfDay: string): number {
    // Return minutes since midnight
    switch (timeOfDay) {
      case 'morning': return 9 * 60 // 9:00 AM
      case 'afternoon': return 14 * 60 // 2:00 PM
      case 'evening': return 18 * 60 // 6:00 PM
      case 'night': return 21 * 60 // 9:00 PM
      default: return 18 * 60
    }
  }

  private formatTime(minutes: number): string {
    const hours = Math.floor(minutes / 60) % 24
    const mins = minutes % 60
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`
  }

  private mapPhaseToDateType(activityType: string, dateType: string): string {
    // Map the phase activity type to search keywords
    if (activityType.includes('restaurant') || activityType.includes('dinner') || activityType.includes('lunch')) {
      return dateType // Use the date type for restaurant searches
    }
    return activityType
  }

  private filterVenuesByRequirements(
    venues: Venue[],
    requirements: string[],
    preferences: DatePreferences
  ): Venue[] {
    return venues.filter(venue => {
      // Check dietary restrictions
      if (preferences.dietaryRestrictions?.length && venue.category === 'restaurant') {
        // In a real implementation, we'd check venue details for dietary options
        // For now, we'll assume higher-rated restaurants are more likely to accommodate
        if (venue.rating < 4.0) return false
      }

      // Check accessibility
      if (preferences.accessibilityNeeds?.length) {
        // Again, in real implementation we'd check specific accessibility features
        // For now, filter out venues with poor ratings
        if (venue.rating < 3.5) return false
      }

      // Check specific requirements
      for (const req of requirements) {
        if (req.includes('outdoor') && !venue.description?.toLowerCase().includes('outdoor')) {
          // Would need more detailed venue info in production
          continue
        }
        if (req.includes('live music') && venue.category !== 'bar') {
          // Simplified check
          continue
        }
      }

      return true
    })
  }

  /**
   * Check if an activity is experiential (not venue-based)
   */
  private isExperientialActivity(activityType: string, phase: string): boolean {
    const experientialKeywords = [
      'walk', 'hike', 'bike', 'stroll', 'jog', 'run',
      'beach', 'sunset', 'sunrise', 'picnic', 'outdoor',
      'park visit', 'nature', 'trail', 'scenic',
      'photography', 'sightseeing', 'exploration'
    ]

    const experientialTypes = ['outdoor', 'nature', 'scenic', 'walk', 'hike', 'bike']

    return experientialTypes.includes(activityType.toLowerCase()) ||
           experientialKeywords.some(keyword => 
             phase.toLowerCase().includes(keyword) || 
             activityType.toLowerCase().includes(keyword)
           )
  }

  /**
   * Generate experiential activities using GPT-4 with real location context
   */
  private async generateExperientialActivity(
    phase: { phase: string; duration: number; vibe: string; activityType: string },
    location: { lat: number; lng: number },
    preferences: DatePreferences,
    currentTime: number,
    budget: { min: number; max: number }
  ): Promise<DateActivity | null> {
    try {
      const locationName = preferences.location.address || 
        `${preferences.location.city}, ${preferences.location.state || ''}`

             const prompt = `Create a specific experiential activity for a ${preferences.dateType} date in ${locationName}.

Activity Type: ${phase.activityType}
Phase: ${phase.phase}
Duration: ${phase.duration} minutes
Vibe: ${phase.vibe}
Budget: $${budget.min}-${budget.max}
Time of day: ${preferences.timeOfDay}

Generate a real, specific activity that someone could actually do in this location. Include:
- A specific, real location with proper address format
- Exact activity description
- Estimated cost (if any)
- Why it fits the date vibe

IMPORTANT: For the "location" field, provide a proper address format like:
- "Golden Gate Park, San Francisco, CA" 
- "Central Park, New York, NY"
- "Griffith Observatory, Los Angeles, CA"
- "Millennium Park, Chicago, IL"

Respond with JSON in this format:
{
  "name": "Specific activity name",
  "location": "Proper address format - Real Place Name, City, State",
  "description": "Detailed activity description",
  "estimatedCost": 25,
  "category": "outdoor|activity|cultural|entertainment"
}`

      const completion = await this.openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You generate real, specific experiential activities for dates. You must provide actual locations and realistic activities. Respond with valid JSON only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 500,
      })

      const response = completion.choices[0].message.content?.trim()
      if (!response) return null

      let cleanedResponse = response
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '')
      }
      if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\s*/, '').replace(/```\s*$/, '')
      }

      const activityData = JSON.parse(cleanedResponse)

      // Create a synthetic venue for the experiential activity
      const syntheticVenue: Venue = {
        id: `experiential-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: activityData.name,
        address: activityData.location || `${preferences.location.city}, ${preferences.location.state || preferences.location.country || ''}`,
        coordinates: {
          lat: location.lat + (Math.random() - 0.5) * 0.02, // Small random offset
          lng: location.lng + (Math.random() - 0.5) * 0.02
        },
        category: activityData.category as Venue['category'] || 'outdoor',
        priceLevel: activityData.estimatedCost > 50 ? 3 : activityData.estimatedCost > 20 ? 2 : 1,
        rating: 4.5, // Default good rating for experiential activities
        reviewCount: 0,
        description: activityData.description
      }

      return {
        id: `activity-${Date.now()}`,
        venue: syntheticVenue,
        startTime: this.formatTime(currentTime),
        endTime: this.formatTime(currentTime + phase.duration),
        description: activityData.description,
        estimatedCost: activityData.estimatedCost || 0,
        notes: phase.vibe
      }

    } catch (error) {
      console.error('Error generating experiential activity:', error)
      return null
    }
  }

  /**
   * Get fallback venue types for when primary search fails
   */
  private getFallbackVenueTypes(activityType: string): string[] {
    const fallbackMap: { [key: string]: string[] } = {
      'restaurant': ['restaurant', 'cafe', 'bar'],
      'bar': ['bar', 'restaurant', 'cafe'],
      'activity': ['entertainment', 'cultural', 'outdoor'],
      'entertainment': ['activity', 'cultural', 'bar'],
      'cultural': ['entertainment', 'activity', 'restaurant'],
      'outdoor': ['activity', 'restaurant', 'cafe']
    }

    return fallbackMap[activityType] || ['restaurant', 'bar', 'activity']
  }
} 