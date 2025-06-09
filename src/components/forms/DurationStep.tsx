'use client'

import { useState } from 'react'
import { DatePreferences } from '@/types'

interface DurationStepProps {
  duration: number
  timeOfDay: DatePreferences['timeOfDay']
  selectedDate?: string // ISO date string (YYYY-MM-DD)
  onUpdate: (duration: number, timeOfDay: DatePreferences['timeOfDay'], selectedDate?: string) => void
}

export default function DurationStep({ duration, timeOfDay, selectedDate, onUpdate }: DurationStepProps) {
  const [localDuration, setLocalDuration] = useState(duration)
  const [localTimeOfDay, setLocalTimeOfDay] = useState(timeOfDay)
  const [localSelectedDate, setLocalSelectedDate] = useState(selectedDate || '')

  const handleDurationChange = (newDuration: number) => {
    setLocalDuration(newDuration)
    onUpdate(newDuration, localTimeOfDay, localSelectedDate)
  }

  const handleTimeOfDayChange = (newTimeOfDay: DatePreferences['timeOfDay']) => {
    setLocalTimeOfDay(newTimeOfDay)
    onUpdate(localDuration, newTimeOfDay, localSelectedDate)
  }

  const handleDateChange = (newDate: string) => {
    setLocalSelectedDate(newDate)
    onUpdate(localDuration, localTimeOfDay, newDate)
  }

  const durationOptions = [
    { value: 60, label: '1 hour', description: 'Quick coffee or drink' },
    { value: 120, label: '2 hours', description: 'Lunch or casual activity' },
    { value: 180, label: '3 hours', description: 'Dinner and activity' },
    { value: 240, label: '4 hours', description: 'Extended date experience' },
    { value: 360, label: '6 hours', description: 'Full day adventure' },
    { value: 480, label: '8+ hours', description: 'All-day experience' },
  ]

  const timeOptions = [
    { 
      value: 'morning' as const, 
      label: 'Morning', 
      emoji: '🌅', 
      description: '8:00 AM - 12:00 PM',
      suggestions: 'Brunch, coffee, outdoor activities'
    },
    { 
      value: 'afternoon' as const, 
      label: 'Afternoon', 
      emoji: '☀️', 
      description: '12:00 PM - 5:00 PM',
      suggestions: 'Lunch, museums, shopping'
    },
    { 
      value: 'evening' as const, 
      label: 'Evening', 
      emoji: '🌆', 
      description: '5:00 PM - 9:00 PM',
      suggestions: 'Dinner, shows, romantic activities'
    },
    { 
      value: 'night' as const, 
      label: 'Night', 
      emoji: '🌙', 
      description: '9:00 PM - Late',
      suggestions: 'Bars, nightlife, late dining'
    },
  ]

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} minutes`
    if (minutes < 120) return `${minutes / 60} hour`
    if (minutes >= 480) return '8+ hours'
    return `${minutes / 60} hours`
  }

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0]
  
  // Get max date (3 months from now)
  const maxDate = new Date()
  maxDate.setMonth(maxDate.getMonth() + 3)
  const maxDateString = maxDate.toISOString().split('T')[0]

  return (
    <div className="space-y-8">
      {/* Date Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          When is your date?
        </h3>
        <div className="space-y-4">
          <input
            type="date"
            value={localSelectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            min={today}
            max={maxDateString}
            className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-primary focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          {!localSelectedDate && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please select a date for your planned date
            </p>
          )}
          {localSelectedDate && (
            <p className="text-sm text-green-600 dark:text-green-400">
              📅 Date selected: {new Date(localSelectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          )}
        </div>
      </div>

      {/* Time of Day Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          What time of day works best?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {timeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleTimeOfDayChange(option.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all hover:scale-105 ${
                localTimeOfDay === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center mb-2">
                <span className="text-2xl mr-3">{option.emoji}</span>
                <div>
                  <div className="font-medium">{option.label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {option.description}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {option.suggestions}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Duration Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          How long should your date be?
        </h3>
        
        {/* Quick Duration Options */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          {durationOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleDurationChange(option.value)}
              className={`p-4 rounded-lg border-2 text-center transition-all hover:scale-105 ${
                localDuration === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="font-medium text-lg mb-1">{option.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {option.description}
              </div>
            </button>
          ))}
        </div>

        {/* Custom Duration Slider */}
        <div>
          <h4 className="font-medium mb-4 text-gray-900 dark:text-white">
            Custom Duration: {formatDuration(localDuration)}
          </h4>
          <input
            type="range"
            min="30"
            max="480"
            step="30"
            value={localDuration}
            onChange={(e) => handleDurationChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>30 min</span>
            <span>2 hours</span>
            <span>4 hours</span>
            <span>8+ hours</span>
          </div>
        </div>
      </div>

      {/* Duration Tips */}
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
          ⏰ Duration Tips
        </h4>
        <ul className="text-sm text-green-800 dark:text-green-200 space-y-1">
          <li>• Consider travel time between activities</li>
          <li>• Shorter dates are great for first meetings</li>
          <li>• Longer dates allow for multiple activities</li>
          <li>• We&apos;ll optimize your itinerary for the time available</li>
        </ul>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: hsl(var(--primary));
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </div>
  )
} 