'use client'

import { useState } from 'react'
import { DatePreferences } from '@/types'

interface DateTypeStepProps {
  dateType: DatePreferences['dateType']
  groupSize: number
  onUpdate: (dateType: DatePreferences['dateType'], groupSize: number) => void
}

export default function DateTypeStep({ dateType, groupSize, onUpdate }: DateTypeStepProps) {
  const [localDateType, setLocalDateType] = useState(dateType)
  const [localGroupSize, setLocalGroupSize] = useState(groupSize)

  const handleDateTypeChange = (newDateType: DatePreferences['dateType']) => {
    setLocalDateType(newDateType)
    onUpdate(newDateType, localGroupSize)
  }

  const handleGroupSizeChange = (newGroupSize: number) => {
    setLocalGroupSize(newGroupSize)
    onUpdate(localDateType, newGroupSize)
  }

  const dateTypes = [
    {
      value: 'romantic' as const,
      label: 'Romantic',
      emoji: '💕',
      description: 'Intimate and romantic experiences',
      examples: 'Candlelit dinner, sunset walks, wine tasting'
    },
    {
      value: 'casual' as const,
      label: 'Casual',
      emoji: '😊',
      description: 'Relaxed and comfortable activities',
      examples: 'Coffee shop, casual dining, movies'
    },
    {
      value: 'adventurous' as const,
      label: 'Adventurous',
      emoji: '🎢',
      description: 'Exciting and thrilling experiences',
      examples: 'Hiking, escape rooms, amusement parks'
    },
    {
      value: 'cultural' as const,
      label: 'Cultural',
      emoji: '🎭',
      description: 'Arts, history, and cultural activities',
      examples: 'Museums, theaters, art galleries'
    },
    {
      value: 'active' as const,
      label: 'Active',
      emoji: '🏃‍♀️',
      description: 'Physical and energetic activities',
      examples: 'Sports, dancing, outdoor activities'
    },
    {
      value: 'relaxed' as const,
      label: 'Relaxed',
      emoji: '🧘‍♀️',
      description: 'Calm and peaceful experiences',
      examples: 'Spa, parks, quiet cafes'
    }
  ]

  const groupSizeOptions = [
    { value: 2, label: 'Just the two of us', emoji: '👫', description: 'Intimate date for two' },
    { value: 4, label: 'Double date', emoji: '👫👫', description: 'Fun with another couple' },
    { value: 6, label: 'Small group', emoji: '👥', description: '4-6 people' },
    { value: 8, label: 'Large group', emoji: '👥👥', description: '6+ people' },
  ]

  return (
    <div className="space-y-8">
      {/* Date Type Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          What kind of date are you looking for?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dateTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => handleDateTypeChange(type.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all hover:scale-105 ${
                localDateType === type.value
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center mb-3">
                <span className="text-3xl mr-3">{type.emoji}</span>
                <div>
                  <div className="font-medium text-lg">{type.label}</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {type.description}
                  </div>
                </div>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                {type.examples}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Group Size Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          How many people will be joining?
        </h3>
        
        {/* Quick Group Size Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {groupSizeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleGroupSizeChange(option.value)}
              className={`p-4 rounded-lg border-2 text-left transition-all hover:scale-105 ${
                localGroupSize === option.value
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
            </button>
          ))}
        </div>

        {/* Custom Group Size */}
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h4 className="font-medium mb-3 text-gray-900 dark:text-white">
            Custom Group Size: {localGroupSize} {localGroupSize === 1 ? 'person' : 'people'}
          </h4>
          <input
            type="range"
            min="1"
            max="20"
            step="1"
            value={localGroupSize}
            onChange={(e) => handleGroupSizeChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>1</span>
            <span>5</span>
            <span>10</span>
            <span>15</span>
            <span>20+</span>
          </div>
        </div>
      </div>

      {/* Date Type Tips */}
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
          💡 Date Type Tips
        </h4>
        <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1">
          <li>• Choose based on your relationship stage and comfort level</li>
          <li>• Consider your partner's interests and preferences</li>
          <li>• Group size affects venue options and activity types</li>
          <li>• We'll suggest activities that match your chosen vibe</li>
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