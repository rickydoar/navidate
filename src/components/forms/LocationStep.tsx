'use client'

import { useState } from 'react'
import { DatePreferences } from '@/types'
import Autocomplete from 'react-google-autocomplete'

interface LocationStepProps {
  location: DatePreferences['location']
  maxTravelDistance: number
  onUpdate: (location: DatePreferences['location'], maxTravelDistance: number) => void
}

// Extended interface to include address field
interface ExtendedLocationData {
  city: string
  state?: string
  country?: string
  coordinates?: {
    lat: number
    lng: number
  }
  address?: string
}

export default function LocationStep({ location, maxTravelDistance, onUpdate }: LocationStepProps) {
  const [localLocation, setLocalLocation] = useState<ExtendedLocationData>({
    city: location.city,
    state: location.state,
    country: location.country,
    coordinates: location.coordinates,
    address: ''
  })
  const [localMaxTravelDistance, setLocalMaxTravelDistance] = useState(maxTravelDistance)

  const handleLocationChange = (field: keyof ExtendedLocationData, value: string) => {
    const newLocation = { ...localLocation, [field]: value }
    setLocalLocation(newLocation)
    // Include address in the location data passed to parent
    onUpdate(newLocation, localMaxTravelDistance)
  }

  const handleDistanceChange = (distance: number) => {
    setLocalMaxTravelDistance(distance)
    onUpdate(localLocation, distance)
  }

  // Get country restrictions based on selected country
  const getCountryRestrictions = () => {
    const selectedCountry = localLocation.country || 'US'
    switch (selectedCountry) {
      case 'US': return ['us']
      case 'CA': return ['ca'] 
      case 'GB': return ['gb']
      case 'AU': return ['au']
      case 'DE': return ['de']
      case 'FR': return ['fr']
      case 'IT': return ['it']
      case 'ES': return ['es']
      case 'JP': return ['jp']
      default: return ['us', 'ca', 'gb', 'au'] // Default to major English-speaking countries
    }
  }

  const handleAddressSelection = (place: google.maps.places.PlaceResult) => {
    if (place) {
      const newLocation: ExtendedLocationData = {
        ...localLocation,
        address: place.formatted_address || '',
        coordinates: place.geometry?.location ? {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        } : localLocation.coordinates
      }

      // Extract city, state, country from place components
      if (place.address_components) {
        place.address_components.forEach((component: google.maps.GeocoderAddressComponent) => {
          const types = component.types
          if (types.includes('locality') || types.includes('administrative_area_level_2')) {
            newLocation.city = component.long_name
          } else if (types.includes('administrative_area_level_1')) {
            newLocation.state = component.short_name
          } else if (types.includes('country')) {
            newLocation.country = component.short_name
          }
        })
      }

      setLocalLocation(newLocation)
      onUpdate(newLocation, localMaxTravelDistance)
    }
  }

  const popularCities = [
    'New York, NY',
    'Los Angeles, CA',
    'Chicago, IL',
    'Houston, TX',
    'Phoenix, AZ',
    'Philadelphia, PA',
    'San Antonio, TX',
    'San Diego, CA',
    'Dallas, TX',
    'San Jose, CA',
    'Austin, TX',
    'Jacksonville, FL',
    'San Francisco, CA',
    'Columbus, OH',
    'Charlotte, NC',
    'Fort Worth, TX',
    'Indianapolis, IN',
    'Seattle, WA',
    'Denver, CO',
    'Boston, MA'
  ]

  const distanceOptions = [
    { value: 5, label: '5 miles', description: 'Stay close to home' },
    { value: 10, label: '10 miles', description: 'Local area' },
    { value: 25, label: '25 miles', description: 'Extended area' },
    { value: 50, label: '50 miles', description: 'Willing to travel' },
  ]

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          const newLocation = {
            ...localLocation,
            coordinates: { lat: latitude, lng: longitude }
          }
          setLocalLocation(newLocation)
          onUpdate(newLocation, localMaxTravelDistance)
          
          // TODO: Reverse geocode to get city name
          // For now, just update coordinates
        },
        (error) => {
          console.error('Error getting location:', error)
          alert('Unable to get your current location. Please enter it manually.')
        }
      )
    } else {
      alert('Geolocation is not supported by this browser.')
    }
  }

  return (
    <div className="space-y-8">
      {/* Location Input */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          Where would you like to have your date?
        </h3>
        
        <div className="space-y-4">
          {/* Exact Address Autocomplete */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Exact Address (Recommended) *
            </label>
            <Autocomplete
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
              onPlaceSelected={handleAddressSelection}
              value={localLocation.address || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleLocationChange('address', e.target.value)}
              options={{
                types: ['geocode'],
                componentRestrictions: { country: getCountryRestrictions() },
                fields: [
                  'formatted_address', 
                  'geometry.location', 
                  'place_id', 
                  'address_components',
                  'name'
                ],
              }}
              language="en"
              placeholder="Enter exact address (e.g., 123 Main St, New York, NY 10001)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '16px',
                backgroundColor: 'transparent',
              }}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Get the most accurate recommendations by entering your exact address. 
              <span className="font-medium">Tip:</span> Select your country below first for better autocomplete results.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center my-6">
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
            <span className="px-4 text-sm text-gray-500 dark:text-gray-400">OR</span>
            <div className="flex-1 border-t border-gray-300 dark:border-gray-600"></div>
          </div>

          {/* Current Location Button */}
          <button
            onClick={handleUseCurrentLocation}
            className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-gray-600 dark:text-gray-400 dark:border-gray-600"
          >
            📍 Use My Current Location
          </button>

          {/* Manual Location Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                City *
              </label>
              <input
                type="text"
                value={localLocation.city}
                onChange={(e) => handleLocationChange('city', e.target.value)}
                placeholder="Enter city name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                list="popular-cities"
              />
              <datalist id="popular-cities">
                {popularCities.map((city) => (
                  <option key={city} value={city} />
                ))}
              </datalist>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                State/Province
              </label>
              <input
                type="text"
                value={localLocation.state || ''}
                onChange={(e) => handleLocationChange('state', e.target.value)}
                placeholder="e.g., CA, NY, ON"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Country
            </label>
            <select
              value={localLocation.country || 'US'}
              onChange={(e) => handleLocationChange('country', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="US">United States</option>
              <option value="CA">Canada</option>
              <option value="GB">United Kingdom</option>
              <option value="AU">Australia</option>
              <option value="DE">Germany</option>
              <option value="FR">France</option>
              <option value="IT">Italy</option>
              <option value="ES">Spain</option>
              <option value="JP">Japan</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Travel Distance */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          How far are you willing to travel?
        </h3>
        
        {/* Quick Distance Options */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {distanceOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleDistanceChange(option.value)}
              className={`p-4 rounded-lg border-2 text-center transition-all hover:scale-105 ${
                localMaxTravelDistance === option.value
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

        {/* Custom Distance Slider */}
        <div>
          <h4 className="font-medium mb-4 text-gray-900 dark:text-white">
            Custom Distance: {localMaxTravelDistance} miles
          </h4>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={localMaxTravelDistance}
            onChange={(e) => handleDistanceChange(parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 slider"
          />
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>1 mile</span>
            <span>25 miles</span>
            <span>50 miles</span>
            <span>100+ miles</span>
          </div>
        </div>
      </div>

      {/* Location Tips */}
      <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
        <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
          📍 Location Tips
        </h4>
        <ul className="text-sm text-orange-800 dark:text-orange-200 space-y-1">
          <li>• Use exact address for the most accurate venue recommendations</li>
          <li>• Address autocomplete helps find real places and coordinates</li>
          <li>• Consider traffic and travel time in your distance choice</li>
          <li>• We&apos;ll suggest venues within your specified radius</li>
          <li>• Popular areas often have more dining and activity options</li>
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