'use client'

import { useState } from 'react'

interface BudgetStepProps {
  budget: { min: number; max: number }
  onUpdate: (budget: { min: number; max: number }) => void
}

export default function BudgetStep({ budget, onUpdate }: BudgetStepProps) {
  const [localBudget, setLocalBudget] = useState(budget)

  const handleMinChange = (value: number) => {
    const newBudget = { ...localBudget, min: Math.min(value, localBudget.max - 10) }
    setLocalBudget(newBudget)
    onUpdate(newBudget)
  }

  const handleMaxChange = (value: number) => {
    const newBudget = { ...localBudget, max: Math.max(value, localBudget.min + 10) }
    setLocalBudget(newBudget)
    onUpdate(newBudget)
  }

  const budgetRanges = [
    { label: 'Budget-friendly', min: 0, max: 50, emoji: '💰' },
    { label: 'Moderate', min: 50, max: 150, emoji: '💳' },
    { label: 'Premium', min: 150, max: 300, emoji: '💎' },
    { label: 'Luxury', min: 300, max: 500, emoji: '🌟' },
  ]

  return (
    <div className="space-y-8">
      {/* Quick Budget Presets */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Quick Budget Options
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {budgetRanges.map((range) => (
            <button
              key={range.label}
              onClick={() => {
                const newBudget = { min: range.min, max: range.max }
                setLocalBudget(newBudget)
                onUpdate(newBudget)
              }}
              className={`p-4 rounded-lg border-2 transition-all hover:scale-105 ${
                localBudget.min >= range.min && localBudget.max <= range.max + 50
                  ? 'border-primary bg-primary/10'
                  : 'border-gray-200 hover:border-gray-300 dark:border-gray-700'
              }`}
            >
              <div className="text-2xl mb-2">{range.emoji}</div>
              <div className="font-medium text-sm">{range.label}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                ${range.min} - ${range.max}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Range Sliders */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Custom Budget Range
        </h3>
        
        <div className="space-y-6">
          {/* Budget Display */}
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">
              ${localBudget.min} - ${localBudget.max}
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Total budget for your date
            </p>
          </div>

          {/* Min Budget Slider */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Minimum Budget: ${localBudget.min}
            </label>
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={localBudget.min}
              onChange={(e) => handleMinChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
            />
          </div>

          {/* Max Budget Slider */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Maximum Budget: ${localBudget.max}
            </label>
            <input
              type="range"
              min="10"
              max="1000"
              step="10"
              value={localBudget.max}
              onChange={(e) => handleMaxChange(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
            />
          </div>
        </div>
      </div>

      {/* Budget Tips */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          💡 Budget Tips
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Include costs for activities, food, drinks, and transportation</li>
          <li>• Consider tips and unexpected expenses</li>
          <li>• We&apos;ll suggest options within your range</li>
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