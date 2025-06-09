'use client'

import { useState } from 'react'

interface PreferencesStepProps {
  dietaryRestrictions: string[]
  accessibilityNeeds: string[]
  onUpdate: (dietaryRestrictions: string[], accessibilityNeeds: string[]) => void
}

export default function PreferencesStep({ 
  dietaryRestrictions, 
  accessibilityNeeds, 
  onUpdate 
}: PreferencesStepProps) {
  const [localDietaryRestrictions, setLocalDietaryRestrictions] = useState(dietaryRestrictions)
  const [localAccessibilityNeeds, setLocalAccessibilityNeeds] = useState(accessibilityNeeds)
  const [customDietary, setCustomDietary] = useState('')
  const [customAccessibility, setCustomAccessibility] = useState('')

  const handleDietaryToggle = (restriction: string) => {
    const updated = localDietaryRestrictions.includes(restriction)
      ? localDietaryRestrictions.filter(r => r !== restriction)
      : [...localDietaryRestrictions, restriction]
    
    setLocalDietaryRestrictions(updated)
    onUpdate(updated, localAccessibilityNeeds)
  }

  const handleAccessibilityToggle = (need: string) => {
    const updated = localAccessibilityNeeds.includes(need)
      ? localAccessibilityNeeds.filter(n => n !== need)
      : [...localAccessibilityNeeds, need]
    
    setLocalAccessibilityNeeds(updated)
    onUpdate(localDietaryRestrictions, updated)
  }

  const addCustomDietary = () => {
    if (customDietary.trim() && !localDietaryRestrictions.includes(customDietary.trim())) {
      const updated = [...localDietaryRestrictions, customDietary.trim()]
      setLocalDietaryRestrictions(updated)
      onUpdate(updated, localAccessibilityNeeds)
      setCustomDietary('')
    }
  }

  const addCustomAccessibility = () => {
    if (customAccessibility.trim() && !localAccessibilityNeeds.includes(customAccessibility.trim())) {
      const updated = [...localAccessibilityNeeds, customAccessibility.trim()]
      setLocalAccessibilityNeeds(updated)
      onUpdate(localDietaryRestrictions, updated)
      setCustomAccessibility('')
    }
  }

  const commonDietaryRestrictions = [
    { value: 'vegetarian', label: 'Vegetarian', emoji: '🥗' },
    { value: 'vegan', label: 'Vegan', emoji: '🌱' },
    { value: 'gluten-free', label: 'Gluten-Free', emoji: '🌾' },
    { value: 'dairy-free', label: 'Dairy-Free', emoji: '🥛' },
    { value: 'nut-free', label: 'Nut-Free', emoji: '🥜' },
    { value: 'kosher', label: 'Kosher', emoji: '✡️' },
    { value: 'halal', label: 'Halal', emoji: '☪️' },
    { value: 'keto', label: 'Keto', emoji: '🥑' },
    { value: 'paleo', label: 'Paleo', emoji: '🍖' },
    { value: 'low-sodium', label: 'Low Sodium', emoji: '🧂' },
  ]

  const commonAccessibilityNeeds = [
    { value: 'wheelchair-accessible', label: 'Wheelchair Accessible', emoji: '♿' },
    { value: 'hearing-assistance', label: 'Hearing Assistance', emoji: '👂' },
    { value: 'visual-assistance', label: 'Visual Assistance', emoji: '👁️' },
    { value: 'service-animal-friendly', label: 'Service Animal Friendly', emoji: '🐕‍🦺' },
    { value: 'elevator-access', label: 'Elevator Access', emoji: '🛗' },
    { value: 'accessible-parking', label: 'Accessible Parking', emoji: '🅿️' },
    { value: 'braille-menus', label: 'Braille Menus', emoji: '📖' },
    { value: 'quiet-environment', label: 'Quiet Environment', emoji: '🔇' },
  ]

  return (
    <div className="space-y-8">
      {/* Dietary Restrictions */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Any dietary restrictions or preferences?
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
          {commonDietaryRestrictions.map((restriction) => (
            <button
              key={restriction.value}
              onClick={() => handleDietaryToggle(restriction.value)}
              className={`p-3 rounded-lg border-2 text-center transition-all hover:scale-105 ${
                localDietaryRestrictions.includes(restriction.value)
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="text-xl mb-1">{restriction.emoji}</div>
              <div className="text-sm font-medium">{restriction.label}</div>
            </button>
          ))}
        </div>

        {/* Custom Dietary Restriction */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customDietary}
            onChange={(e) => setCustomDietary(e.target.value)}
            placeholder="Add custom dietary restriction"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            onKeyPress={(e) => e.key === 'Enter' && addCustomDietary()}
          />
          <button
            onClick={addCustomDietary}
            className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Add
          </button>
        </div>

        {/* Selected Dietary Restrictions */}
        {localDietaryRestrictions.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Selected dietary restrictions:
            </h4>
            <div className="flex flex-wrap gap-2">
              {localDietaryRestrictions.map((restriction) => (
                <span
                  key={restriction}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20"
                >
                  {restriction}
                  <button
                    onClick={() => handleDietaryToggle(restriction)}
                    className="ml-2 text-primary hover:text-primary/70"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Accessibility Needs */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Any accessibility needs?
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          {commonAccessibilityNeeds.map((need) => (
            <button
              key={need.value}
              onClick={() => handleAccessibilityToggle(need.value)}
              className={`p-3 rounded-lg border-2 text-left transition-all hover:scale-105 ${
                localAccessibilityNeeds.includes(need.value)
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="flex items-center">
                <span className="text-xl mr-3">{need.emoji}</span>
                <span className="text-sm font-medium">{need.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Custom Accessibility Need */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customAccessibility}
            onChange={(e) => setCustomAccessibility(e.target.value)}
            placeholder="Add custom accessibility need"
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            onKeyPress={(e) => e.key === 'Enter' && addCustomAccessibility()}
          />
          <button
            onClick={addCustomAccessibility}
            className="px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Add
          </button>
        </div>

        {/* Selected Accessibility Needs */}
        {localAccessibilityNeeds.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Selected accessibility needs:
            </h4>
            <div className="flex flex-wrap gap-2">
              {localAccessibilityNeeds.map((need) => (
                <span
                  key={need}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20"
                >
                  {need}
                  <button
                    onClick={() => handleAccessibilityToggle(need)}
                    className="ml-2 text-primary hover:text-primary/70"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Preferences Tips */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-indigo-900 dark:text-indigo-100 mb-2">
          💡 Preferences Tips
        </h4>
        <ul className="text-sm text-indigo-800 dark:text-indigo-200 space-y-1">
          <li>• These preferences help us filter venue recommendations</li>
          <li>• You can always skip this step if you don&apos;t have specific needs</li>
          <li>• We&apos;ll prioritize venues that accommodate your requirements</li>
          <li>• More specific preferences lead to better-tailored suggestions</li>
        </ul>
      </div>

      {/* Skip Option */}
      <div className="text-center">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Don&apos;t have any specific preferences? That&apos;s perfectly fine! 
          <br />
          We&apos;ll suggest great options for everyone.
        </p>
      </div>
    </div>
  )
} 