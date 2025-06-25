import { Venue } from '@/types'

interface PlaceSearchParams {
  location: { lat: number; lng: number }
  radius: number // in meters
  type?: string
  keyword?: string
  minPrice?: number
  maxPrice?: number
  openNow?: boolean
}

interface PlaceDetails {
  place_id: string
  name: string
  formatted_address?: string
  vicinity?: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  rating?: number
  user_ratings_total?: number
  price_level?: number
  types?: string[]
  opening_hours?: {
    open_now?: boolean
    weekday_text?: string[]
  }
  formatted_phone_number?: string
  website?: string
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
}

export class GooglePlacesService {
  private apiKey: string
  private baseUrl = 'https://maps.googleapis.com/maps/api/place'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  /**
   * Search for places near a location
   */
  async searchPlaces(params: PlaceSearchParams): Promise<PlaceDetails[]> {
    const url = new URL(`${this.baseUrl}/nearbysearch/json`)
    
    url.searchParams.append('key', this.apiKey)
    url.searchParams.append('location', `${params.location.lat},${params.location.lng}`)
    url.searchParams.append('radius', params.radius.toString())
    
    if (params.type) {
      url.searchParams.append('type', params.type)
    }
    
    if (params.keyword) {
      url.searchParams.append('keyword', params.keyword)
    }
    
    if (params.minPrice !== undefined && params.maxPrice !== undefined) {
      url.searchParams.append('minprice', params.minPrice.toString())
      url.searchParams.append('maxprice', params.maxPrice.toString())
    }
    
    if (params.openNow) {
      url.searchParams.append('opennow', 'true')
    }

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      throw new Error(`Google Places API error: ${data.status}`)
    }

    return data.results || []
  }

  /**
   * Get detailed information about a specific place
   */
  async getPlaceDetails(placeId: string): Promise<PlaceDetails> {
    const url = new URL(`${this.baseUrl}/details/json`)
    
    url.searchParams.append('key', this.apiKey)
    url.searchParams.append('place_id', placeId)
    url.searchParams.append('fields', 'place_id,name,formatted_address,geometry,rating,user_ratings_total,price_level,types,opening_hours,formatted_phone_number,website,photos')

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK') {
      throw new Error(`Google Places API error: ${data.status}`)
    }

    return data.result
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(
    point1: { lat: number; lng: number },
    point2: { lat: number; lng: number }
  ): number {
    const R = 3959 // Radius of Earth in miles
    const dLat = this.toRad(point2.lat - point1.lat)
    const dLon = this.toRad(point2.lng - point1.lng)
    const lat1 = this.toRad(point1.lat)
    const lat2 = this.toRad(point2.lat)

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.sin(dLon/2) * Math.sin(dLon/2) * Math.cos(lat1) * Math.cos(lat2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    
    return R * c
  }

  private toRad(deg: number): number {
    return deg * (Math.PI/180)
  }

  /**
   * Convert Google Places data to our Venue format
   */
  convertToVenue(place: PlaceDetails): Venue {
    const categoryMap: { [key: string]: Venue['category'] } = {
      'restaurant': 'restaurant',
      'bar': 'bar',
      'museum': 'cultural',
      'art_gallery': 'cultural',
      'park': 'outdoor',
      'movie_theater': 'entertainment',
      'bowling_alley': 'activity',
      'amusement_park': 'activity',
      'zoo': 'outdoor',
      'aquarium': 'activity',
      'night_club': 'bar',
      'cafe': 'restaurant',
      'bakery': 'restaurant',
    }

    // Find the best matching category
    let category: Venue['category'] = 'activity'
    if (place.types) {
      for (const type of place.types) {
        if (categoryMap[type]) {
          category = categoryMap[type]
          break
        }
      }
    }

    // Create a more detailed address if formatted_address is missing
    let address = place.formatted_address
    if (!address && place.vicinity) {
      address = place.vicinity
    }
    if (!address) {
      address = 'Address not available'
    }

    const venue = {
      id: place.place_id,
      name: place.name,
      address,
      coordinates: {
        lat: place.geometry.location.lat,
        lng: place.geometry.location.lng
      },
      category,
      priceLevel: (place.price_level || 2) as 1 | 2 | 3 | 4,
      rating: place.rating || 0,
      reviewCount: place.user_ratings_total || 0,
      photos: place.photos?.map(photo => 
        `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${this.apiKey}`
      ),
      website: place.website,
      phone: place.formatted_phone_number,
      openingHours: place.opening_hours?.weekday_text?.reduce((acc, day, index) => {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        acc[days[index]] = day
        return acc
      }, {} as { [key: string]: string })
    }

    // Debug logging to check address data
    if (!place.formatted_address && !place.vicinity) {
      console.warn(`Venue ${place.name} missing both formatted_address and vicinity:`, place)
    }

    return venue
  }

  /**
   * Search for venues matching date preferences
   */
  async searchVenuesForDate(
    location: { lat: number; lng: number },
    dateType: string,
    priceRange: { min: number; max: number },
    maxDistance: number
  ): Promise<Venue[]> {
    const searchQueries = this.getSearchQueriesForDateType(dateType)
    const radiusInMeters = maxDistance * 1609.34 // Convert miles to meters
    
    const venueMap = new Map<string, Venue>() // Use Map to deduplicate by place_id
    
    for (const query of searchQueries) {
      try {
        const places = await this.searchPlaces({
          location,
          radius: radiusInMeters,
          keyword: query.keyword,
          type: query.type,
          minPrice: this.budgetToPriceLevel(priceRange.min),
          maxPrice: this.budgetToPriceLevel(priceRange.max)
        })

        for (const place of places) {
          // Skip if we already have this venue
          if (venueMap.has(place.place_id)) {
            continue
          }

          const venue = this.convertToVenue(place)
          
          // Filter by distance (Google sometimes returns places outside radius)
          const distance = this.calculateDistance(location, venue.coordinates)
          if (distance <= maxDistance) {
            venueMap.set(venue.id, venue)
          }
        }
      } catch (error) {
        console.error(`Error searching for ${query.keyword}:`, error)
      }
    }

    // Convert Map to array and sort by rating quality score
    const venues = Array.from(venueMap.values())
    
    // Sort by a combination of rating and review count for better quality
    return venues
      .sort((a, b) => {
        const scoreA = a.rating * Math.log(a.reviewCount + 1) // Logarithmic weighting
        const scoreB = b.rating * Math.log(b.reviewCount + 1)
        return scoreB - scoreA
      })
      .slice(0, 15) // Return more venues for better selection
  }

  private getSearchQueriesForDateType(dateType: string): Array<{ keyword: string; type?: string }> {
    const queries: { [key: string]: Array<{ keyword: string; type?: string }> } = {
      romantic: [
        { keyword: 'fine dining restaurant', type: 'restaurant' },
        { keyword: 'wine bar', type: 'bar' },
        { keyword: 'rooftop restaurant' },
        { keyword: 'cocktail bar', type: 'bar' },
        { keyword: 'romantic dinner' },
        { keyword: 'upscale restaurant', type: 'restaurant' }
      ],
      casual: [
        { keyword: 'casual dining', type: 'restaurant' },
        { keyword: 'pub', type: 'bar' },
        { keyword: 'cafe', type: 'cafe' },
        { keyword: 'brewery' },
        { keyword: 'bistro', type: 'restaurant' },
        { keyword: 'sports bar', type: 'bar' }
      ],
      adventurous: [
        { keyword: 'escape room' },
        { keyword: 'rock climbing gym' },
        { keyword: 'adventure park' },
        { keyword: 'mini golf' },
        { keyword: 'bowling', type: 'bowling_alley' },
        { keyword: 'arcade' }
      ],
      cultural: [
        { keyword: 'museum', type: 'museum' },
        { keyword: 'art gallery', type: 'art_gallery' },
        { keyword: 'theater' },
        { keyword: 'cultural center' },
        { keyword: 'live music venue' },
        { keyword: 'jazz club', type: 'bar' }
      ],
      active: [
        { keyword: 'bowling alley', type: 'bowling_alley' },
        { keyword: 'mini golf' },
        { keyword: 'sports bar', type: 'bar' },
        { keyword: 'recreation center' },
        { keyword: 'fitness center' },
        { keyword: 'dance studio' }
      ],
      relaxed: [
        { keyword: 'spa' },
        { keyword: 'park', type: 'park' },
        { keyword: 'coffee shop', type: 'cafe' },
        { keyword: 'bookstore cafe' },
        { keyword: 'tea house' },
        { keyword: 'quiet restaurant', type: 'restaurant' }
      ],
             // Add specific activity types for better venue selection
       restaurant: [
         { keyword: 'restaurant', type: 'restaurant' },
         { keyword: 'dining', type: 'restaurant' },
         { keyword: 'bistro', type: 'restaurant' },
         { keyword: 'eatery', type: 'restaurant' }
       ],
       bar: [
         { keyword: 'bar', type: 'bar' },
         { keyword: 'pub', type: 'bar' },
         { keyword: 'cocktail lounge', type: 'bar' },
         { keyword: 'wine bar', type: 'bar' }
       ],
       activity: [
         { keyword: 'entertainment' },
         { keyword: 'recreation center' },
         { keyword: 'bowling', type: 'bowling_alley' },
         { keyword: 'arcade' },
         { keyword: 'mini golf' }
       ],
       entertainment: [
         { keyword: 'movie theater', type: 'movie_theater' },
         { keyword: 'cinema', type: 'movie_theater' },
         { keyword: 'bowling alley', type: 'bowling_alley' },
         { keyword: 'arcade' },
         { keyword: 'entertainment center' }
       ]
    }

    return queries[dateType] || queries.casual
  }

  private budgetToPriceLevel(budget: number): number {
    // Convert budget per person to Google price level (0-4)
    if (budget < 15) return 0
    if (budget < 30) return 1
    if (budget < 60) return 2
    if (budget < 100) return 3
    return 4
  }
}

// Export singleton instance
export const googlePlaces = new GooglePlacesService(process.env.GOOGLE_PLACES_API_KEY || '') 