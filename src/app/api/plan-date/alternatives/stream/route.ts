import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { DatePreferences, DateActivity } from '@/types'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { 
      preferences, 
      currentActivity, 
      otherActivities,
      activityIndex 
    }: { 
      preferences: DatePreferences
      currentActivity: DateActivity
      otherActivities: DateActivity[]
      activityIndex: number
    } = await request.json()

    if (!preferences || !currentActivity) {
      return new Response('Preferences and current activity are required', { status: 400 })
    }

    // Create a prompt for generating alternative activities
    const prompt = createAlternativesPrompt(preferences, currentActivity, otherActivities, activityIndex)

    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "system",
                content: "You are an expert date planner who suggests alternative activities that fit seamlessly into existing date itineraries. You understand timing, location, budget constraints, and how activities flow together. Always respond with valid JSON."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.8,
            max_tokens: 1500,
            stream: true,
          })

          let accumulatedContent = ''
          
          // Send initial progress update
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Searching for alternative activities...',
            progress: 0
          })}\n\n`))

          let tokenCount = 0
          const estimatedTotalTokens = 1200 // Rough estimate for progress calculation

          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              accumulatedContent += content
              tokenCount += content.split(' ').length // Rough token estimation
              
              const progress = Math.min(90, (tokenCount / estimatedTotalTokens) * 100)
              
              // Send progress update
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
                type: 'progress',
                message: 'Finding perfect alternatives...',
                progress: Math.round(progress),
                partial_content: content
              })}\n\n`))
            }
          }

          // Send processing update
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'progress',
            message: 'Validating alternatives and checking compatibility...',
            progress: 95
          })}\n\n`))

          // Parse and validate the response
          let parsedResponse: { alternatives?: unknown[]; reasoning?: string }
          try {
            parsedResponse = JSON.parse(accumulatedContent)
          } catch {
            console.error('Failed to parse AI response:', accumulatedContent)
            controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
              type: 'error',
              message: 'Failed to parse alternatives response. Please try again.'
            })}\n\n`))
            controller.close()
            return
          }

          const response = {
            alternatives: parsedResponse.alternatives || [],
            reasoning: parsedResponse.reasoning || '',
          }

          // Send final result
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'complete',
            message: 'Alternative activities found!',
            progress: 100,
            data: response
          })}\n\n`))

          controller.close()

        } catch (error) {
          console.error('Error in streaming alternatives generation:', error)
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({
            type: 'error',
            message: 'Failed to generate alternatives. Please try again.'
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
    console.error('Error setting up alternatives streaming:', error)
    return new Response('Failed to start alternatives stream', { status: 500 })
  }
}

function createAlternativesPrompt(
  preferences: DatePreferences, 
  currentActivity: DateActivity, 
  otherActivities: DateActivity[],
  activityIndex: number
): string {
  const {
    budget,
    dateType,
    location,
    maxTravelDistance,
    dietaryRestrictions = [],
    accessibilityNeeds = [],
    timeOfDay,
    groupSize
  } = preferences

  // Format location
  const formatLocation = () => {
    if (location.address) {
      return `${location.address}${location.coordinates ? ` (${location.coordinates.lat}, ${location.coordinates.lng})` : ''}`
    }
    return `${location.city}${location.state ? `, ${location.state}` : ''}${location.country ? `, ${location.country}` : ''}`
  }

  // Calculate remaining budget
  const otherActivitiesCost = otherActivities.reduce((sum, activity) => sum + activity.estimatedCost, 0)
  const remainingBudget = {
    min: Math.max(0, budget.min - otherActivitiesCost),
    max: Math.max(0, budget.max - otherActivitiesCost)
  }

  // Get context about surrounding activities
  const previousActivity = activityIndex > 0 ? otherActivities[activityIndex - 1] : null
  const nextActivity = activityIndex < otherActivities.length ? otherActivities[activityIndex] : null

  return `I need 3 alternative activities to replace the current activity in a date itinerary.

**Current Activity to Replace:**
- Name: ${currentActivity.venue.name}
- Category: ${currentActivity.venue.category}
- Time Slot: ${currentActivity.startTime} - ${currentActivity.endTime}
- Cost: $${currentActivity.estimatedCost}
- Location: ${currentActivity.venue.address}

**Date Context:**
- Date Type: ${dateType}
- Time of Day: ${timeOfDay}
- Group Size: ${groupSize} people
- Location: ${formatLocation()}
- Max Travel Distance: ${maxTravelDistance} miles
- Dietary Restrictions: ${dietaryRestrictions.length > 0 ? dietaryRestrictions.join(', ') : 'None'}
- Accessibility Needs: ${accessibilityNeeds.length > 0 ? accessibilityNeeds.join(', ') : 'None'}

**Budget Constraints:**
- Available for this activity: $${remainingBudget.min} - $${remainingBudget.max}
- (Total budget: $${budget.min} - $${budget.max}, other activities cost: $${otherActivitiesCost})

**Surrounding Activities:**
${previousActivity ? `- Previous Activity: ${previousActivity.venue.name} (${previousActivity.venue.address}) ending at ${previousActivity.endTime}` : '- This is the first activity'}
${nextActivity ? `- Next Activity: ${nextActivity.venue.name} (${nextActivity.venue.address}) starting at ${nextActivity.startTime}` : '- This is the last activity'}

**Requirements:**
1. Find 3 different alternative venues/activities that fit the same time slot
2. PRIORITIZE finding alternatives in the same category (${currentActivity.venue.category}) when possible - if replacing a restaurant, try to find other restaurants; if replacing an activity, find similar activities
3. Each alternative should complement the overall ${dateType} date theme
4. Consider travel time from the previous activity and to the next activity
5. Stay within the available budget range
6. All venues must be within ${maxTravelDistance} miles of ${formatLocation()}
7. If you can't find 3 good alternatives in the same category, you may include 1-2 alternatives from complementary categories that would work well in this time slot

Respond with a JSON object in this exact format:
{
  "alternatives": [
    {
      "id": "alt-venue-1",
      "venue": {
        "id": "venue-id-1",
        "name": "Alternative Venue Name",
        "address": "Full address",
        "coordinates": { "lat": 0.0, "lng": 0.0 },
        "category": "restaurant|bar|activity|entertainment|outdoor|cultural",
        "priceLevel": 1-4,
        "rating": 4.5,
        "reviewCount": 100,
        "description": "Brief venue description"
      },
      "startTime": "${currentActivity.startTime}",
      "endTime": "${currentActivity.endTime}",
      "description": "What you'll do here and why it fits the date",
      "estimatedCost": 40,
      "notes": "Why this is a great alternative"
    }
  ],
  "reasoning": "Brief explanation of why these alternatives work well for this ${dateType} date, noting whether they maintain the same category (${currentActivity.venue.category}) or why different categories were chosen"
}

IMPORTANT:
- Keep the same time slot (${currentActivity.startTime} - ${currentActivity.endTime})
- Each alternative must cost between $${remainingBudget.min} and $${remainingBudget.max}
- STRONGLY PREFER alternatives in the same category (${currentActivity.venue.category}) to maintain the date structure
- Consider the flow from ${previousActivity?.venue.name || 'start'} to ${nextActivity?.venue.name || 'end'}
- Provide realistic venues with accurate addresses and coordinates
- Make sure alternatives offer different experiences while fitting the ${dateType} theme
- Only suggest different categories if there aren't enough good options in the current category (${currentActivity.venue.category})`
} 