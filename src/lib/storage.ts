import { DatePreferences, DateItinerary } from '@/types'

// Local storage keys
const STORAGE_KEYS = {
  USER_PREFERENCES: 'navidate_user_preferences',
  SAVED_DATES: 'navidate_saved_dates',
  FAVORITE_DATES: 'navidate_favorite_dates',
} as const

// User preferences storage
export const userPreferences = {
  get(): Partial<DatePreferences> | null {
    if (typeof window === 'undefined') return null
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES)
      return stored ? JSON.parse(stored) : null
    } catch (error) {
      console.error('Error reading user preferences:', error)
      return null
    }
  },

  set(preferences: Partial<DatePreferences>): void {
    if (typeof window === 'undefined') return
    
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences))
    } catch (error) {
      console.error('Error saving user preferences:', error)
    }
  },

  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEYS.USER_PREFERENCES)
  }
}

// Saved dates storage
export const savedDates = {
  getAll(): DateItinerary[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SAVED_DATES)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading saved dates:', error)
      return []
    }
  },

  save(dateItinerary: DateItinerary): void {
    if (typeof window === 'undefined') return
    
    try {
      const existing = this.getAll()
      const updated = existing.filter(d => d.id !== dateItinerary.id)
      updated.push(dateItinerary)
      localStorage.setItem(STORAGE_KEYS.SAVED_DATES, JSON.stringify(updated))
    } catch (error) {
      console.error('Error saving date:', error)
    }
  },

  remove(dateId: string): void {
    if (typeof window === 'undefined') return
    
    try {
      const existing = this.getAll()
      const updated = existing.filter(d => d.id !== dateId)
      localStorage.setItem(STORAGE_KEYS.SAVED_DATES, JSON.stringify(updated))
    } catch (error) {
      console.error('Error removing date:', error)
    }
  },

  getById(dateId: string): DateItinerary | null {
    const dates = this.getAll()
    return dates.find(d => d.id === dateId) || null
  },

  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEYS.SAVED_DATES)
  }
}

// Favorite dates storage
export const favoriteDates = {
  getAll(): string[] {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.FAVORITE_DATES)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading favorite dates:', error)
      return []
    }
  },

  add(dateId: string): void {
    if (typeof window === 'undefined') return
    
    try {
      const existing = this.getAll()
      if (!existing.includes(dateId)) {
        existing.push(dateId)
        localStorage.setItem(STORAGE_KEYS.FAVORITE_DATES, JSON.stringify(existing))
      }
    } catch (error) {
      console.error('Error adding favorite date:', error)
    }
  },

  remove(dateId: string): void {
    if (typeof window === 'undefined') return
    
    try {
      const existing = this.getAll()
      const updated = existing.filter(id => id !== dateId)
      localStorage.setItem(STORAGE_KEYS.FAVORITE_DATES, JSON.stringify(updated))
    } catch (error) {
      console.error('Error removing favorite date:', error)
    }
  },

  isFavorite(dateId: string): boolean {
    return this.getAll().includes(dateId)
  },

  clear(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem(STORAGE_KEYS.FAVORITE_DATES)
  }
}

// Export/Import functionality
export const dataManager = {
  exportData(): string {
    const data = {
      preferences: userPreferences.get(),
      savedDates: savedDates.getAll(),
      favoriteDates: favoriteDates.getAll(),
      exportedAt: new Date().toISOString(),
    }
    return JSON.stringify(data, null, 2)
  },

  importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData)
      
      if (data.preferences) {
        userPreferences.set(data.preferences)
      }
      
      if (data.savedDates && Array.isArray(data.savedDates)) {
        localStorage.setItem(STORAGE_KEYS.SAVED_DATES, JSON.stringify(data.savedDates))
      }
      
      if (data.favoriteDates && Array.isArray(data.favoriteDates)) {
        localStorage.setItem(STORAGE_KEYS.FAVORITE_DATES, JSON.stringify(data.favoriteDates))
      }
      
      return true
    } catch (error) {
      console.error('Error importing data:', error)
      return false
    }
  },

  clearAllData(): void {
    userPreferences.clear()
    savedDates.clear()
    favoriteDates.clear()
  }
} 