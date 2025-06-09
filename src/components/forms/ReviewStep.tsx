'use client'

import { DatePreferences } from '@/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface ReviewStepProps {
  preferences: DatePreferences
  onEdit: (stepIndex: number) => void
}

export default function ReviewStep({ preferences, onEdit }: ReviewStepProps) {
  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`
    if (minutes < 120) return `${minutes / 60} hour`
    if (minutes >= 480) return '8+ hours'
    return `${minutes / 60} hours`
  }

  const formatTimeOfDay = (timeOfDay: string) => {
    const timeMap = {
      morning: '🌅 Morning (8:00 AM - 12:00 PM)',
      afternoon: '☀️ Afternoon (12:00 PM - 5:00 PM)',
      evening: '🌆 Evening (5:00 PM - 9:00 PM)',
      night: '🌙 Night (9:00 PM - Late)'
    }
    return timeMap[timeOfDay as keyof typeof timeMap] || timeOfDay
  }

  const formatDateType = (dateType: string) => {
    const typeMap = {
      romantic: '💕 Romantic',
      casual: '😊 Casual',
      adventurous: '🎢 Adventurous',
      cultural: '🎭 Cultural',
      active: '🏃‍♀️ Active',
      relaxed: '🧘‍♀️ Relaxed'
    }
    return typeMap[dateType as keyof typeof typeMap] || dateType
  }

  const formatLocation = (location: DatePreferences['location']) => {
    if (location.address) {
      return location.address
    }
    const parts = [location.city, location.state, location.country].filter(Boolean)
    return parts.join(', ') || 'Not specified'
  }

  return (
    <div className="space-y-6">
      {/* Summary Header */}
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Review Your Date Preferences
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Make sure everything looks good before we generate your perfect date plan!
        </p>
      </div>

      {/* Preferences Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget & Duration */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              💰 Budget & Time
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(0)}
                className="text-primary hover:text-primary/80"
              >
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Budget:</span>
              <span className="ml-2 text-primary font-semibold">
                ${preferences.budget.min} - ${preferences.budget.max}
              </span>
            </div>
            <div>
              <span className="font-medium">Duration:</span>
              <span className="ml-2">{formatDuration(preferences.duration)}</span>
            </div>
            <div>
              <span className="font-medium">Time:</span>
              <span className="ml-2">{formatTimeOfDay(preferences.timeOfDay)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Date Type & Group */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              🎯 Date Style
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(2)}
                className="text-primary hover:text-primary/80"
              >
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Type:</span>
              <span className="ml-2">{formatDateType(preferences.dateType)}</span>
            </div>
            <div>
              <span className="font-medium">Group Size:</span>
              <span className="ml-2">
                {preferences.groupSize} {preferences.groupSize === 1 ? 'person' : 'people'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              📍 Location
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(3)}
                className="text-primary hover:text-primary/80"
              >
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Area:</span>
              <span className="ml-2">{formatLocation(preferences.location)}</span>
            </div>
            <div>
              <span className="font-medium">Travel Distance:</span>
              <span className="ml-2">Up to {preferences.maxTravelDistance} miles</span>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              ⚙️ Special Needs
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onEdit(4)}
                className="text-primary hover:text-primary/80"
              >
                Edit
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <span className="font-medium">Dietary:</span>
              <div className="mt-1">
                {preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {preferences.dietaryRestrictions.map((restriction) => (
                      <span
                        key={restriction}
                        className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full dark:bg-green-900/20 dark:text-green-200"
                      >
                        {restriction}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 text-sm">None specified</span>
                )}
              </div>
            </div>
            <div>
              <span className="font-medium">Accessibility:</span>
              <div className="mt-1">
                {preferences.accessibilityNeeds && preferences.accessibilityNeeds.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {preferences.accessibilityNeeds.map((need) => (
                      <span
                        key={need}
                        className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full dark:bg-blue-900/20 dark:text-blue-200"
                      >
                        {need}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500 dark:text-gray-400 text-sm">None specified</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Generation Preview */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-lg text-blue-900 dark:text-blue-100">
            🤖 What happens next?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
            <div className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              <span>Our AI will analyze your preferences and find the perfect venues in your area</span>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              <span>We&apos;ll create a detailed itinerary with timing, activities, and estimated costs</span>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              <span>You&apos;ll get multiple options to choose from, with backup suggestions</span>
            </div>
            <div className="flex items-start">
              <span className="font-bold mr-2">4.</span>
              <span>Save your favorite plans and get directions to each venue</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Check */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
        <div className="flex items-start">
          <span className="text-yellow-600 dark:text-yellow-400 mr-2">⚠️</span>
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            <p className="font-medium mb-1">Before we generate your date plan:</p>
            <ul className="space-y-1">
              <li>• Make sure your location is accurate for the best recommendations</li>
              <li>• Double-check your budget range includes all expected expenses</li>
              <li>• Consider any special occasions or themes you&apos;d like to include</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Ready to Generate */}
      <div className="text-center pt-4">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Ready to discover your perfect date? Click the button below to generate your personalized plan!
        </p>
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <span>🔒</span>
          <span>Your preferences are private and secure</span>
        </div>
      </div>
    </div>
  )
} 