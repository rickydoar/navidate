'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { DatePreferences } from '@/types'
import { useStreamingAPI } from '@/hooks/useStreamingAPI'
import { StreamingProgress } from '@/components/ui/StreamingProgress'

// Step components
import BudgetStep from '@/components/forms/BudgetStep'
import DurationStep from '@/components/forms/DurationStep'
import DateTypeStep from '@/components/forms/DateTypeStep'
import LocationStep from '@/components/forms/LocationStep'
import PreferencesStep from '@/components/forms/PreferencesStep'
import ReviewStep from '@/components/forms/ReviewStep'

const STEPS = [
  { id: 'budget', title: 'Budget', description: 'How much would you like to spend?' },
  { id: 'duration', title: 'Duration', description: 'How long do you have?' },
  { id: 'type', title: 'Date Type', description: 'What kind of date are you looking for?' },
  { id: 'location', title: 'Location', description: 'Where would you like to go?' },
  { id: 'preferences', title: 'Preferences', description: 'Any special requirements?' },
  { id: 'review', title: 'Review', description: 'Review your preferences' },
]

export default function PlanPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [preferences, setPreferences] = useState<Partial<DatePreferences>>({
    budget: { min: 50, max: 200 },
    duration: 180, // 3 hours default
    dateType: 'romantic',
    location: { city: '', country: 'US' },
    maxTravelDistance: 10,
    timeOfDay: 'evening',
    groupSize: 2,
    selectedDate: '',
  })

  const updatePreferences = (updates: Partial<DatePreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }))
  }

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const [error, setError] = useState<string | null>(null)

  // Streaming hook for date plan generation
  const { 
    isLoading, 
    progress, 
    message, 
    error: streamingError, 
    data: streamingData,
    startStream
  } = useStreamingAPI()

  const handleSubmit = async () => {
    setError(null)
    
    try {
      await startStream('/api/plan-date/stream', { preferences })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  // Handle streaming completion
  useEffect(() => {
    if (streamingData && !isLoading && !streamingError) {
      console.log('Date plan generated via streaming:', streamingData)
      localStorage.setItem('generatedDatePlan', JSON.stringify(streamingData))
      window.location.href = '/date-plan'
    }
  }, [streamingData, isLoading, streamingError])

  const renderStep = () => {
    switch (STEPS[currentStep].id) {
      case 'budget':
        return (
          <BudgetStep
            budget={preferences.budget!}
            onUpdate={(budget: { min: number; max: number }) => updatePreferences({ budget })}
          />
        )
      case 'duration':
        return (
          <DurationStep
            duration={preferences.duration!}
            timeOfDay={preferences.timeOfDay!}
            selectedDate={preferences.selectedDate}
            onUpdate={(duration: number, timeOfDay: DatePreferences['timeOfDay'], selectedDate?: string) => 
              updatePreferences({ duration, timeOfDay, selectedDate })}
          />
        )
      case 'type':
        return (
          <DateTypeStep
            dateType={preferences.dateType!}
            groupSize={preferences.groupSize!}
            onUpdate={(dateType: DatePreferences['dateType'], groupSize: number) => updatePreferences({ dateType, groupSize })}
          />
        )
      case 'location':
        return (
          <LocationStep
            location={preferences.location!}
            maxTravelDistance={preferences.maxTravelDistance!}
            onUpdate={(location: DatePreferences['location'], maxTravelDistance: number) => updatePreferences({ location, maxTravelDistance })}
          />
        )
      case 'preferences':
        return (
          <PreferencesStep
            dietaryRestrictions={preferences.dietaryRestrictions || []}
            accessibilityNeeds={preferences.accessibilityNeeds || []}
            onUpdate={(dietaryRestrictions: string[], accessibilityNeeds: string[]) => 
              updatePreferences({ dietaryRestrictions, accessibilityNeeds })
            }
          />
        )
      case 'review':
        return (
          <ReviewStep
            preferences={preferences as DatePreferences}
            onEdit={(stepIndex: number) => setCurrentStep(stepIndex)}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <Link className="flex items-center justify-center" href="/">
          <span className="text-2xl font-bold text-primary">Navidate</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/">
            Home
          </Link>
        </nav>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Plan Your Perfect Date
            </h1>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {STEPS.length}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300 ease-in-out"
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((step, index) => (
              <div 
                key={step.id}
                className={`flex flex-col items-center ${
                  index <= currentStep ? 'text-primary' : 'text-gray-400'
                }`}
              >
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-2 ${
                    index <= currentStep 
                      ? 'bg-primary text-white' 
                      : 'bg-gray-200 text-gray-500 dark:bg-gray-700'
                  }`}
                >
                  {index + 1}
                </div>
                <span className="text-xs text-center hidden sm:block">{step.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-2xl text-gray-900 dark:text-white">
              {STEPS[currentStep].title}
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 dark:text-gray-300">
              {STEPS[currentStep].description}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="px-6 pb-6">
            {renderStep()}
            
            {/* Streaming Progress */}
            {(isLoading || streamingError || progress > 0) && (
              <div className="mt-4">
                <StreamingProgress
                  isLoading={isLoading}
                  progress={progress}
                  message={message}
                  error={streamingError}
                />
              </div>
            )}

            {/* Error message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-8"
          >
            Previous
          </Button>
          
          {currentStep === STEPS.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {message || 'Generating Your Perfect Date...'}
                </>
              ) : (
                'Generate My Date Plan'
              )}
            </Button>
          ) : (
            <Button
              onClick={nextStep}
              className="px-8"
            >
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  )
} 