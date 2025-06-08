import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { DatePreferences } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { preferences }: { preferences: DatePreferences } = await request.json()

    if (!preferences) {
      return new Response('Date preferences are required', { status: 400 })
    }

    // Create a detailed prompt for OpenAI
    const prompt = createDatePlanningPrompt(preferences)

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: "You are an expert date planner who creates personalized, and memorable date experiences. You have extensive knowledge of venues, activities, and timing to create perfect date itineraries. Always respond with valid JSON that matches the expected schema."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2000,
            stream: true,
          })

          let accumulatedContent = ''
          
          // Send initial progress update
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Starting to generate your perfect date...',
            progress: 0
          })}\n\n`))

          let tokenCount = 0
          const estimatedTotalTokens = 1500 // Rough estimate for progress calculation

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              accumulatedContent += content
              tokenCount += content.split(' ').length // Rough token estimation
              
              const progress = Math.min(90, (tokenCount / estimatedTotalTokens) * 100)
              
              // Send progress update
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                type: 'progress',
                message: 'Generating your date plan...',
                progress: Math.round(progress),
                partial_content: content
              })}\n\n`))
            }
          }

          // Send processing update
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Processing and validating your date plan...',
            progress: 95
          })}\n\n`))

          // Parse and validate the response
          let parsedResponse: any
          try {
            parsedResponse = JSON.parse(accumulatedContent)
          } catch (parseError) {
            console.error('Failed to parse AI response:', accumulatedContent)
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
              type: 'error',
              message: 'Failed to parse AI response. Please try again.'
            })}\n\n`))
            controller.close()
            return
          }

          // Transform the AI response into our expected format
          const itinerary = {
            title: parsedResponse.title || 'Your Perfect Date',
            description: parsedResponse.description || 'A personalized date experience',
            activities: parsedResponse.activities || [],
            totalCost: parsedResponse.totalCost || { min: 0, max: 0 },
            totalDuration: parsedResponse.totalDuration || 0,
            preferences,
            isFavorite: false,
            tags: parsedResponse.tags || []
          }

          const response = {
            itinerary,
            alternatives: parsedResponse.alternatives || [],
            reasoning: parsedResponse.reasoning || '',
            confidence: parsedResponse.confidence || 0.8
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
            message: 'Failed to generate date plan. Please try again.'
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

function createDatePlanningPrompt(preferences: DatePreferences): string {
  const {
    budget,
    duration,
    dateType,
    location,
    maxTravelDistance,
    dietaryRestrictions = [],
    accessibilityNeeds = [],
    timeOfDay,
    groupSize,
    selectedDate
  } = preferences

  // Generate appropriate start times based on time of day
  const getTimeRange = (timeOfDay: string) => {
    switch (timeOfDay) {
      case 'morning': return { start: '09:00', end: '12:00' }
      case 'afternoon': return { start: '13:00', end: '17:00' }
      case 'evening': return { start: '18:00', end: '21:00' }
      case 'night': return { start: '21:00', end: '23:30' }
      default: return { start: '18:00', end: '21:00' }
    }
  }

  const timeRange = getTimeRange(timeOfDay)
  const dateForPrompt = selectedDate || new Date().toISOString().split('T')[0]

  // Format location - prioritize exact address if available
  const formatLocation = () => {
    if (location.address) {
      return `${location.address}${location.coordinates ? ` (${location.coordinates.lat}, ${location.coordinates.lng})` : ''}`
    }
    return `${location.city}${location.state ? `, ${location.state}` : ''}${location.country ? `, ${location.country}` : ''}`
  }

  return `Create a detailed date itinerary based on these preferences:

**Date**: ${dateForPrompt}
**Budget**: $${budget.min} - $${budget.max}
**Duration**: ${Math.floor(duration / 60)} hours ${duration % 60} minutes
**Date Type**: ${dateType}
**Location**: ${formatLocation()}
**Max Travel Distance**: ${maxTravelDistance} miles
**Time of Day**: ${timeOfDay} (suggested start time between ${timeRange.start} and ${timeRange.end})
**Group Size**: ${groupSize} people
**Dietary Restrictions**: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'None'}
**Accessibility Needs**: ${accessibilityNeeds.length > 0 ? accessibilityNeeds.join(', ') : 'None'}

Please create a detailed date plan that includes 2-4 activities/venues that fit within the budget and time constraints. Consider travel time between locations and ensure they're all within the specified travel distance.

${location.address ? 
`IMPORTANT: The user has provided an exact address (${location.address}). Use this as the central reference point for all recommendations. Find venues within ${maxTravelDistance} miles of this specific address. Include precise travel times and distances from this address to each venue.` : 
`The user has provided a general location (${location.city}${location.state ? `, ${location.state}` : ''}). Find popular venues in this area within ${maxTravelDistance} miles of the city center.`}

Respond with a JSON object in this exact format:
{
  "title": "Creative title for the date",
  "description": "Brief description of the overall experience",
  "activities": [
    {
      "id": "unique-id-1",
      "venue": {
        "id": "venue-id-1",
        "name": "Venue Name",
        "address": "Full address",
        "coordinates": { "lat": 0.0, "lng": 0.0 },
        "category": "restaurant|bar|activity|entertainment|outdoor|cultural",
        "priceLevel": 1-4,
        "rating": 4.5,
        "reviewCount": 100,
        "description": "Brief venue description",
        "estimatedDuration": 90,
        "estimatedCost": { "min": 30, "max": 50 }
      },
      "startTime": "18:00",
      "endTime": "19:30",
      "description": "What you'll do here",
      "estimatedCost": 40,
      "travelTimeToNext": 15,
      "notes": "Any special notes"
    }
  ],
  "totalCost": { "min": 80, "max": 150 },
  "totalDuration": ${duration},
  "reasoning": "Brief explanation of why this itinerary works well",
  "confidence": 0.9,
  "tags": ["romantic", "foodie", "outdoor"],
  "alternatives": [
    {
      "id": "alt-venue-1",
      "name": "Alternative Venue",
      "address": "Address",
      "coordinates": { "lat": 0.0, "lng": 0.0 },
      "category": "restaurant",
      "priceLevel": 2,
      "rating": 4.2,
      "reviewCount": 85,
      "description": "Alternative option description"
    }
  ]
}

IMPORTANT FORMATTING REQUIREMENTS:
- Use the date ${dateForPrompt} for planning
- Return times in HH:MM format (24-hour) WITHOUT timezone or date information
- Start the first activity between ${timeRange.start} and ${timeRange.end} based on the ${timeOfDay} preference
${location.address ? 
`- Use ${location.address} as the central reference point for all venue recommendations and travel calculations
- All venues must be within ${maxTravelDistance} miles of ${location.address}
- Calculate realistic travel times from ${location.address} to each venue` :
`- Make sure all venues are realistic and appropriate for ${location.city}`}
- Include specific addresses and realistic coordinates for all venues
- Ensure the total cost stays within the $${budget.min}-$${budget.max} budget range
- Schedule activities logically with appropriate time gaps for travel and transitions`
} 