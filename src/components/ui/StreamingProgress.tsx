import React from 'react'
import { Progress } from '@/components/ui/progress'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'

interface StreamingProgressProps {
  isLoading: boolean
  progress: number
  message: string
  error?: string | null
  className?: string
}

export function StreamingProgress({ 
  isLoading, 
  progress, 
  message, 
  error, 
  className = '' 
}: StreamingProgressProps) {
  if (!isLoading && !error && progress === 0) {
    return null
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Status Icon and Message */}
      <div className="flex items-center space-x-3">
        {error ? (
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
        ) : progress === 100 ? (
          <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
        ) : (
          <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
        )}
        
        <div className="flex-1">
          <p className={`text-sm font-medium ${
            error ? 'text-red-700 dark:text-red-300' : 
            progress === 100 ? 'text-green-700 dark:text-green-300' : 
            'text-blue-700 dark:text-blue-300'
          }`}>
            {error || message}
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      {!error && (
        <div className="space-y-2">
          <Progress 
            value={progress} 
            className="w-full h-2"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
        </div>
      )}

      {/* Error Details */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
          <p className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        </div>
      )}
    </div>
  )
} 