export interface DatePreferences {
  budget: {
    min: number
    max: number
  }
  duration: number // in minutes
  dateType: 'romantic' | 'casual' | 'adventurous' | 'cultural' | 'active' | 'relaxed'
  location: {
    city: string
    state?: string
    country?: string
    address?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  maxTravelDistance: number // in miles
  dietaryRestrictions?: string[]
  accessibilityNeeds?: string[]
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'
  groupSize: number
  selectedDate?: string // ISO date string (YYYY-MM-DD)
}

export interface Venue {
  id: string
  name: string
  address: string
  coordinates: {
    lat: number
    lng: number
  }
  category: 'restaurant' | 'bar' | 'activity' | 'entertainment' | 'outdoor' | 'cultural'
  priceLevel: 1 | 2 | 3 | 4 // $ to $$$$
  rating: number
  reviewCount: number
  photos?: string[]
  description?: string
  openingHours?: {
    [key: string]: string
  }
  website?: string
  phone?: string
  estimatedDuration?: number // in minutes
  estimatedCost?: {
    min: number
    max: number
  }
}

export interface DateActivity {
  id: string
  venue: Venue
  startTime: string // ISO string
  endTime: string // ISO string
  description: string
  estimatedCost: number
  travelTimeToNext?: number // in minutes
  notes?: string
}

export interface DateItinerary {
  id: string
  title: string
  description: string
  activities: DateActivity[]
  totalCost: {
    min: number
    max: number
  }
  totalDuration: number // in minutes
  createdAt: string // ISO string
  preferences: DatePreferences
  userId?: string
  isFavorite?: boolean
  tags?: string[]
}

export interface User {
  id: string
  name?: string
  preferences?: Partial<DatePreferences>
}

export interface AIRecommendationRequest {
  preferences: DatePreferences
  excludeVenues?: string[] // Venue IDs to exclude
  includeAlternatives?: boolean
}

export interface AIRecommendationResponse {
  itinerary: Omit<DateItinerary, 'id' | 'createdAt' | 'userId'>
  alternatives?: Venue[]
  reasoning?: string
  confidence: number // 0-1
} 