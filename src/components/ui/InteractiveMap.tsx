'use client'

import { useMemo } from 'react'
import dynamic from 'next/dynamic'
import { DateActivity } from '@/types'

interface InteractiveMapProps {
  activities: DateActivity[]
  activeActivity?: number
  onActivityClick?: (activityIndex: number) => void
  className?: string
}

// Dynamic import to avoid SSR issues with Leaflet
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)

const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)

const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)

const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

export default function InteractiveMap({ 
  activities, 
  activeActivity, 
  onActivityClick, 
  className = "" 
}: InteractiveMapProps) {
  // Debug: log activities prop
  console.log('[InteractiveMap] activities:', activities)
  // Calculate map center and bounds
  const { center, bounds } = useMemo(() => {
    if (activities.length === 0) {
      console.log('[InteractiveMap] No activities, using default center')
      return { center: [40.7128, -74.0060] as [number, number], bounds: null } // Default to NYC
    }

    const coordinates = activities.map(activity => [
      activity.venue.coordinates.lat,
      activity.venue.coordinates.lng
    ])

    // Calculate center
    const avgLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length
    const avgLng = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length

    // Calculate bounds for auto-fit
    const lats = coordinates.map(coord => coord[0])
    const lngs = coordinates.map(coord => coord[1])
    const bounds = [
      [Math.min(...lats), Math.min(...lngs)],
      [Math.max(...lats), Math.max(...lngs)]
    ] as [[number, number], [number, number]]

    console.log('[InteractiveMap] Calculated center:', [avgLat, avgLng], 'bounds:', bounds)
    return { center: [avgLat, avgLng] as [number, number], bounds }
  }, [activities])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Custom marker icon based on activity index
  const createCustomIcon = (index: number, isActive: boolean) => {
    if (typeof window === 'undefined') return null
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const L = require('leaflet')
    const icon = L.divIcon({
      html: `<div class="w-8 h-8 ${isActive ? 'bg-blue-600' : 'bg-gray-600'} text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg border-2 border-white">${index + 1}</div>`,
      className: 'custom-div-icon',
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32]
    })
    console.log('[InteractiveMap] Created icon for marker', index, 'isActive:', isActive, icon)
    return icon
  }

  if (typeof window === 'undefined') {
    // Loading placeholder for SSR
    return (
      <div className={`aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-500 dark:text-gray-400">
          <div className="w-12 h-12 mx-auto mb-2 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
          <p className="text-sm">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={center}
        zoom={13}
        className="h-full w-full rounded-lg"
        bounds={bounds || undefined}
        boundsOptions={{ padding: [20, 20] }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {activities.map((activity, index) => {
          const icon = createCustomIcon(index, activeActivity === index)
          if (!icon) return null
          console.log('[InteractiveMap] Marker', index, 'position:', [activity.venue.coordinates.lat, activity.venue.coordinates.lng])
          return (
            <Marker
              key={activity.id}
              position={[activity.venue.coordinates.lat, activity.venue.coordinates.lng]}
              icon={icon}
              eventHandlers={{
                click: () => {
                  console.log('[InteractiveMap] Marker clicked:', index)
                  onActivityClick?.(index)
                }
              }}
            >
              <Popup>
                <div className="min-w-[250px] p-2">
                  <h3 className="font-bold text-lg mb-2">{activity.venue.name}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span>{formatTime(activity.startTime)} - {formatTime(activity.endTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cost:</span>
                      <span className="font-medium">{formatCurrency(activity.estimatedCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Category:</span>
                      <span className="capitalize">{activity.venue.category}</span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-gray-700">{activity.description}</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      📍 {activity.venue.address}
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>
    </div>
  )
} 