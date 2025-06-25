'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import InteractiveMap from '@/components/ui/InteractiveMap'
import { AIRecommendationResponse, DateActivity } from '@/types'
import { Clock, MapPin, Star, Users, ArrowLeft, RefreshCw, Check, X, Edit3 } from 'lucide-react'
import { useStreamingAPI } from '@/hooks/useStreamingAPI'
import { StreamingProgress } from '@/components/ui/StreamingProgress'

interface AlternativesAPIResponse {
  alternatives: DateActivity[]
  reasoning: string
  promptRating?: {
    score: number
    reasons: string[]
    suggestions: string[]
  }
}

export default function EditDatePlanPage() {
  const [datePlan, setDatePlan] = useState<AIRecommendationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [editingActivityIndex, setEditingActivityIndex] = useState<number | null>(null)
  const [alternatives, setAlternatives] = useState<DateActivity[]>([])
  const [isLoadingAlternatives, setIsLoadingAlternatives] = useState(false)
  const [alternativesReasoning, setAlternativesReasoning] = useState('')
  const [, setPromptRating] = useState<{score: number, reasons: string[], suggestions: string[]} | null>(null)

  // Streaming hook for alternatives
  const { 
    isLoading: streamingLoading, 
    progress, 
    message, 
    error: streamingError, 
    data: streamingData,
    startStream,
    reset: resetStream
  } = useStreamingAPI()

  useEffect(() => {
    // Get the generated date plan from localStorage
    const storedPlan = localStorage.getItem('generatedDatePlan')
    if (storedPlan) {
      try {
        const parsedPlan = JSON.parse(storedPlan)
        setDatePlan(parsedPlan)
      } catch (error) {
        console.error('Failed to parse stored date plan:', error)
      }
    }
    setIsLoading(false)
  }, [])

  // Handle streaming completion for alternatives
  useEffect(() => {
    if (streamingData && !streamingLoading && !streamingError) {
      const data = streamingData as AlternativesAPIResponse
      setAlternatives(data.alternatives || [])
      setAlternativesReasoning(data.reasoning || '')
      setIsLoadingAlternatives(false)
    }
  }, [streamingData, streamingLoading, streamingError])

  const formatTime = (timeString: string) => {
    // Handle both old format (ISO) and new format (HH:MM)
    if (timeString.includes('T') || timeString.includes('Z')) {
      // Old ISO format
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } else {
      // New HH:MM format
      const [hours, minutes] = timeString.split(':')
      const hour24 = parseInt(hours)
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
      const ampm = hour24 >= 12 ? 'PM' : 'AM'
      return `${hour12}:${minutes} ${ampm}`
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getPriceLevelText = (level: number) => {
    return '$'.repeat(level)
  }

  const getDateTypeColor = (dateType: string) => {
    const colors = {
      romantic: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
      casual: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      adventurous: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      cultural: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      relaxed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300'
    }
    return colors[dateType as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
  }

  const handleGenerateAlternatives = async (activityIndex: number, event: React.MouseEvent) => {
    event.stopPropagation() // Prevent card click
    
    if (!datePlan || isLoadingAlternatives || streamingLoading) return

    setEditingActivityIndex(activityIndex)
    setAlternatives([])
    setAlternativesReasoning('')
    setPromptRating(null)
    resetStream()

    const currentActivity = datePlan.itinerary.activities[activityIndex]
    const otherActivities = datePlan.itinerary.activities.filter((_, index) => index !== activityIndex)

    setIsLoadingAlternatives(true)
    try {
      await startStream('/api/plan-date/alternatives/stream', {
        preferences: datePlan.itinerary.preferences,
        currentActivity,
        otherActivities,
        activityIndex
      })
    } catch (error) {
      console.error('Error generating alternatives:', error)
      alert('Failed to generate alternatives. Please try again.')
      setIsLoadingAlternatives(false)
    }
  }

  const handleReplaceActivity = (alternativeIndex: number) => {
    if (!datePlan || editingActivityIndex === null) return

    const newActivities = [...datePlan.itinerary.activities]
    newActivities[editingActivityIndex] = alternatives[alternativeIndex]

    // Recalculate total cost
    const newTotalCost = newActivities.reduce((sum, activity) => sum + activity.estimatedCost, 0)
    
    const updatedDatePlan = {
      ...datePlan,
      itinerary: {
        ...datePlan.itinerary,
        activities: newActivities,
        totalCost: {
          min: newTotalCost,
          max: newTotalCost
        }
      }
    }

    setDatePlan(updatedDatePlan)
    localStorage.setItem('generatedDatePlan', JSON.stringify(updatedDatePlan))
    
    // Close the alternatives view
    setEditingActivityIndex(null)
    setAlternatives([])
  }

  const handleCancelEdit = () => {
    setEditingActivityIndex(null)
    setAlternatives([])
    setAlternativesReasoning('')
    setPromptRating(null)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading your date plan...</p>
        </div>
      </div>
    )
  }

  if (!datePlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
          <Link className="flex items-center justify-center" href="/">
            <span className="text-2xl font-bold text-primary">Navidate</span>
          </Link>
        </header>
        
        <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-2xl p-12 shadow-xl">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              No Date Plan Found
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
              Please generate a date plan first before editing.
            </p>
            <Link href="/plan">
              <Button size="lg" className="px-8 py-3 text-lg">
                Plan Your Perfect Date
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { itinerary } = datePlan

      return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="/">
          <span className="text-2xl font-bold text-primary">Navidate</span>
        </Link>
        <div className="ml-4 flex items-center gap-2">
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
            <Edit3 className="w-3 h-3 mr-1" />
            Edit Mode
          </Badge>
        </div>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link href="/date-plan">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Plan
            </Button>
          </Link>
        </nav>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Badge className={getDateTypeColor(itinerary.preferences.dateType)}>
              {itinerary.preferences.dateType}
            </Badge>
            <Badge variant="secondary">
              <Users className="w-3 h-3 mr-1" />
              {itinerary.preferences.groupSize} {itinerary.preferences.groupSize === 1 ? 'person' : 'people'}
            </Badge>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            <Edit3 className="inline-block w-12 h-12 mr-4 text-orange-500" />
            Edit Your Date Plan
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Click the &ldquo;Find Alternatives&rdquo; button on any activity to see other options that fit your preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Date Timeline</h2>
            
            {itinerary.activities.map((activity: DateActivity, index: number) => (
              <Card 
                key={activity.id} 
                className={`shadow-xl border-2 transition-all duration-300 ${
                  editingActivityIndex === index 
                    ? 'border-orange-500 bg-orange-50/90 dark:bg-orange-900/20 scale-[1.02]' 
                    : 'border-orange-300 bg-orange-50/50 dark:bg-orange-900/10 hover:scale-[1.01] hover:border-orange-400'
                } backdrop-blur-sm`}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          editingActivityIndex === index ? 'bg-orange-600' : 'bg-orange-500'
                        }`}>
                          {editingActivityIndex === index ? (
                            <RefreshCw className="w-6 h-6" />
                          ) : (
                            index + 1
                          )}
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-xl text-gray-900 dark:text-white mb-2">
                          {activity.venue.name}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {activity.venue.category}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(activity.estimatedCost)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getPriceLevelText(activity.venue.priceLevel)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Edit Mode Indicator */}
                  <div className="mt-4 p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                        <Edit3 className="inline w-4 h-4 mr-1" />
                        Ready to customize this activity
                      </p>
                      <Button 
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        onClick={(e) => handleGenerateAlternatives(index, e)}
                        disabled={isLoadingAlternatives || streamingLoading}
                      >
                        {(isLoadingAlternatives || streamingLoading) && editingActivityIndex === index ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Finding...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Find Alternatives
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {activity.description}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{activity.venue.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {activity.venue.rating} ({activity.venue.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                    
                    {activity.venue.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>About:</strong> {activity.venue.description}</p>
                      </div>
                    )}
                  </div>

                  {activity.notes && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>💡 Tip:</strong> {activity.notes}
                      </p>
                    </div>
                  )}

                  {(activity.travelTimeToNext ?? 0) > 0 && index < itinerary.activities.length - 1 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>🚗 {activity.travelTimeToNext} minutes to next location</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Alternatives Panel */}
            {editingActivityIndex !== null && (
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg text-gray-900 dark:text-white">
                      Alternative Options
                    </CardTitle>
                    <Button variant="ghost" size="sm" onClick={handleCancelEdit}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Streaming Progress for Alternatives */}
                  {(isLoadingAlternatives || streamingLoading || streamingError || progress > 0) && (
                    <div className="mb-4">
                      <StreamingProgress
                        isLoading={isLoadingAlternatives || streamingLoading}
                        progress={progress}
                        message={message || 'Finding alternatives...'}
                        error={streamingError}
                      />
                    </div>
                  )}

                  {!isLoadingAlternatives && !streamingLoading && alternatives.length > 0 ? (
                    <div className="space-y-4">
                      {alternativesReasoning && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>💡 Why these work:</strong> {alternativesReasoning}
                          </p>
                        </div>
                      )}
                      
                      {alternatives.map((alternative, index) => (
                        <div key={alternative.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white">
                              {alternative.venue.name}
                            </h4>
                            <span className="text-sm font-bold text-green-600">
                              {formatCurrency(alternative.estimatedCost)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {alternative.description}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <span>{alternative.venue.category}</span>
                            <span>{getPriceLevelText(alternative.venue.priceLevel)}</span>
                            <span>⭐ {alternative.venue.rating}</span>
                          </div>
                          
                          {alternative.notes && (
                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-3">
                              {alternative.notes}
                            </p>
                          )}
                          
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleReplaceActivity(index)}
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Choose This Option
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : editingActivityIndex !== null && !isLoadingAlternatives && !streamingLoading && (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-300">
                        Click &ldquo;Find Alternatives&rdquo; to see other options
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Interactive Map */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Route Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InteractiveMap 
                  activities={itinerary.activities}
                  activeActivity={editingActivityIndex || 0}
                  onActivityClick={() => {}}
                  className="aspect-square"
                />
              </CardContent>
            </Card>

            {/* Summary */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Updated Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total Cost:</span>
                    <span className="font-semibold">
                      {formatCurrency(itinerary.totalCost.min)} - {formatCurrency(itinerary.totalCost.max)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                    <span className="font-semibold">
                      {Math.floor(itinerary.totalDuration / 60)}h {itinerary.totalDuration % 60}m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Activities:</span>
                    <span className="font-semibold">{itinerary.activities.length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 