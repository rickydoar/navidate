import { useState, useCallback } from 'react'

interface StreamingProgress {
  type: 'progress' | 'complete' | 'error'
  message: string
  progress: number
  partial_content?: string
  data?: unknown
}

interface UseStreamingAPIReturn {
  isLoading: boolean
  progress: number
  message: string
  error: string | null
  data: unknown
  startStream: (url: string, body: unknown) => Promise<void>
  reset: () => void
}

export function useStreamingAPI(): UseStreamingAPIReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [message, setMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<unknown>(null)

  const reset = useCallback(() => {
    setIsLoading(false)
    setProgress(0)
    setMessage('')
    setError(null)
    setData(null)
  }, [])

  const startStream = useCallback(async (url: string, body: unknown) => {
    reset()
    setIsLoading(true)
    setMessage('Initializing...')

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body reader available')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        
        // Process complete lines
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = line.slice(6) // Remove 'data: ' prefix
              if (jsonData.trim()) {
                const update: StreamingProgress = JSON.parse(jsonData)
                
                setProgress(update.progress)
                setMessage(update.message)
                
                if (update.type === 'complete') {
                  setData(update.data)
                  setIsLoading(false)
                } else if (update.type === 'error') {
                  setError(update.message)
                  setIsLoading(false)
                }
              }
            } catch (parseError) {
              console.error('Failed to parse streaming data:', parseError)
            }
          }
        }
      }
    } catch (err) {
      console.error('Streaming error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred during streaming')
      setIsLoading(false)
    }
  }, [reset])

  return {
    isLoading,
    progress,
    message,
    error,
    data,
    startStream,
    reset
  }
} 