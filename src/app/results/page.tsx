'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AIRecommendationResponse, DateActivity } from '@/types'

export default function ResultsPage() {
  const [datePlan, setDatePlan] = useState<AIRecommendationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading your date plan...</p>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            No Date Plan Found
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            It looks like you haven&apos;t generated a date plan yet.
          </p>
          <Link href="/plan">
            <Button className="px-8">Plan Your Date</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { itinerary, reasoning, confidence } = datePlan

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <Link className="flex items-center justify-center" href="/">
          <span className="text-2xl font-bold text-primary">Navidate</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/plan">
            Plan Another Date
          </Link>
        </nav>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {itinerary.title}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
            {itinerary.description}
          </p>
          <div className="flex justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>
              Total Cost: {formatCurrency(itinerary.totalCost.min)} - {formatCurrency(itinerary.totalCost.max)}
            </span>
            <span>•</span>
            <span>
              Duration: {Math.floor(itinerary.totalDuration / 60)}h {itinerary.totalDuration % 60}m
            </span>
            <span>•</span>
            <span>
              Confidence: {Math.round(confidence * 100)}%
            </span>
          </div>
        </div>

        {/* Activities */}
        <div className="space-y-6 mb-8">
          {itinerary.activities.map((activity: DateActivity, index: number) => (
            <Card key={activity.id} className="shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl text-gray-900 dark:text-white">
                      {index + 1}. {activity.venue.name}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(activity.estimatedCost)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {getPriceLevelText(activity.venue.priceLevel)}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-gray-700 dark:text-gray-300 mb-3">
                      {activity.description}
                    </p>
                    <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <p><strong>Address:</strong> {activity.venue.address}</p>
                      <p><strong>Category:</strong> {activity.venue.category}</p>
                      <p><strong>Rating:</strong> ⭐ {activity.venue.rating} ({activity.venue.reviewCount} reviews)</p>
                      {activity.venue.description && (
                        <p><strong>About:</strong> {activity.venue.description}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    {activity.notes && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-3">
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          <strong>Note:</strong> {activity.notes}
                        </p>
                      </div>
                    )}
                    {(activity.travelTimeToNext ?? 0) > 0 && index < itinerary.activities.length - 1 && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        <p>🚗 {activity.travelTimeToNext} minutes to next location</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Reasoning */}
        {reasoning && (
          <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 mb-8">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">
                Why This Plan Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 dark:text-gray-300">{reasoning}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-center gap-4">
          <Link href="/plan">
            <Button variant="outline" className="px-8">
              Plan Another Date
            </Button>
          </Link>
          <Button 
            className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            onClick={() => {
              // TODO: Implement save functionality
              alert('Save functionality coming soon!')
            }}
          >
            Save This Plan
          </Button>
        </div>
      </div>
    </div>
  )
} 