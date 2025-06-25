import { NextRequest } from 'next/server'
import { DatePreferences, Venue } from '@/types'
import { DatePlannerService } from '@/lib/date-planner'
import { googlePlaces } from '@/lib/google-places'

export async function POST(request: NextRequest) {
  try {
    const { preferences }: { preferences: DatePreferences } = await request.json()

    if (!preferences) {
      return new Response('Date preferences are required', { status: 400 })
    }

    // Validate API keys
    if (!process.env.OPENAI_API_KEY || !process.env.GOOGLE_PLACES_API_KEY) {
      return new Response('API keys not configured', { status: 500 })
    }

    // Create service instance
    const planner = new DatePlannerService(process.env.OPENAI_API_KEY)

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial progress update
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Starting to plan your perfect date...',
            progress: 0
          })}\n\n`))

          // Step 1: Generate creative date structure with GPT-4
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Creating a personalized date concept...',
            progress: 20
          })}\n\n`))

          const dateStructure = await planner.generateDateStructure(preferences)

          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'progress',
            message: `Planning: ${dateStructure.theme}`,
            progress: 40,
            partial_data: {
              theme: dateStructure.theme,
              description: dateStructure.description
            }
          })}\n\n`))

          // Step 2: Find real venues matching the structure
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Finding perfect venues near you...',
            progress: 60
          })}\n\n`))

          const activities = await planner.findVenuesForStructure(dateStructure, preferences)

          if (activities.length === 0) {
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
              type: 'error',
              message: 'No suitable venues found in your area. Try adjusting your preferences.'
            })}\n\n`))
            controller.close()
            return
          }

          // Step 3: Enhance with creative descriptions
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Adding the finishing touches...',
            progress: 80
          })}\n\n`))

          let enhancedActivities = activities
          try {
            enhancedActivities = await planner.enhanceActivitiesWithDescriptions(
              activities,
              dateStructure
            )
          } catch (error) {
            console.error('Failed to enhance descriptions, using basic activities:', error)
            // Continue with basic activities if enhancement fails
          }

          // Step 4: Find alternative venues
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Finding backup options...',
            progress: 90
          })}\n\n`))

          let alternatives: Venue[] = []
          try {
            alternatives = await findAlternativeVenues(preferences, enhancedActivities)
          } catch (error) {
            console.error('Failed to find alternatives:', error)
            // Continue without alternatives
          }

          // Calculate total cost and duration
          const totalCost = {
            min: enhancedActivities.reduce((sum, a) => sum + (a.estimatedCost * 0.8), 0),
            max: enhancedActivities.reduce((sum, a) => sum + (a.estimatedCost * 1.2), 0)
          }

          const totalDuration = enhancedActivities.reduce((sum, a) => {
            const start = parseTime(a.startTime)
            const end = parseTime(a.endTime)
            return sum + (end - start) + (a.travelTimeToNext || 0)
          }, 0)

          // Prepare final response
          const itinerary = {
            title: dateStructure.theme,
            description: dateStructure.description,
            activities: enhancedActivities,
            totalCost,
            totalDuration,
            preferences,
            isFavorite: false,
            tags: generateTags(dateStructure, preferences)
          }

          const response = {
            itinerary,
            alternatives,
            reasoning: `I've created a ${preferences.dateType} date experience that flows naturally from ${dateStructure.flow.map(f => f.phase.toLowerCase()).join(' to ')}. Each venue has been verified to exist and is within ${preferences.maxTravelDistance} miles of your location.`,
            confidence: 0.95 // Higher confidence due to real venue data
          }

          // Send final result
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'complete',
            message: 'Your perfect date plan is ready!',
            progress: 100,
            data: response
          })}\n\n`))

          controller.close()

        } catch (error) {
          console.error('Error in streaming date planning:', error)
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'error',
            message: error instanceof Error ? error.message : 'Failed to generate date plan. Please try again.'
          })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })

  } catch (error) {
    console.error('Error setting up streaming:', error)
    return new Response('Failed to start date planning stream', { status: 500 })
  }
}

async function findAlternativeVenues(
  preferences: DatePreferences,
  plannedActivities: { venue: { id: string; coordinates: { lat: number; lng: number } } }[]
): Promise<Venue[]> {
  const location = preferences.location.coordinates || 
    (plannedActivities[0]?.venue.coordinates)

  if (!location) return []

  // Get venue IDs we're already using
  const usedVenueIds = new Set(plannedActivities.map(a => a.venue.id))

  // Search for alternatives of different types
  const searchTypes = ['restaurant', 'bar', 'activity', 'cultural']
  const alternatives: Venue[] = []

  for (const type of searchTypes) {
    try {
      const venues = await googlePlaces.searchVenuesForDate(
        location,
        type,
        preferences.budget,
        preferences.maxTravelDistance
      )

      // Add venues we haven't already selected
      const newVenues = venues.filter(v => !usedVenueIds.has(v.id))
      alternatives.push(...newVenues.slice(0, 2)) // Take top 2 of each type
    } catch (error) {
      console.error(`Error finding alternatives for ${type}:`, error)
    }
  }

  return alternatives.slice(0, 6) // Return max 6 alternatives
}

function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours * 60 + minutes
}

function generateTags(structure: { flow: Array<{ activityType: string; vibe: string }> }, preferences: DatePreferences): string[] {
  const tags: string[] = [preferences.dateType]
  
  // Add tags based on structure
  if (structure.flow.some((f) => f.activityType.includes('restaurant'))) {
    tags.push('foodie')
  }
  if (structure.flow.some((f) => f.activityType.includes('outdoor'))) {
    tags.push('outdoor')
  }
  if (structure.flow.some((f) => f.vibe.includes('romantic'))) {
    tags.push('romantic')
  }
  if (preferences.timeOfDay === 'night') {
    tags.push('nightlife')
  }
  
  return Array.from(new Set(tags)) // Remove duplicates
} 