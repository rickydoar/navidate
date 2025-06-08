# Interactive Map Implementation Tasks

## Overview
This document outlines the tasks needed to replace the current mocked-up interactive map in the date plan page with a fully functional map that displays date activities, routes, and provides interactive features.

## Current State
- **Location**: Map placeholder exists in `/src/app/date-plan/page.tsx` (lines ~350-360)
- **Status**: Static placeholder with MapPin icon and "Interactive map coming soon" text
- **Data Available**: 
  - Venue coordinates (`lat`, `lng`) in `DateActivity.venue.coordinates`
  - Venue addresses and names
  - Activity sequence and timing
  - Travel time between activities

## Phase 1: Setup and Dependencies

### Task 1.1: Choose and Install Map Library
**Priority**: High  
**Estimated Time**: 2-4 hours

Options to evaluate:
- **React Leaflet** (Open source, free, customizable)
- **Google Maps React** (Requires API key, paid after limits)
- **Mapbox GL JS** (Free tier available, modern styling)

**Recommendation**: Start with React Leaflet for cost-effectiveness

**Steps**:
1. Install dependencies:
   ```bash
   npm install react-leaflet leaflet
   npm install -D @types/leaflet
   ```
2. Import CSS in global styles or component
3. Create basic map component test

### Task 1.2: Environment Setup
**Priority**: High  
**Estimated Time**: 30 minutes

**Steps**:
1. Add environment variables for map services (if needed)
2. Configure Next.js for dynamic imports (maps need client-side rendering)
3. Update TypeScript config if needed

## Phase 2: Basic Map Component

### Task 2.1: Create InteractiveMap Component
**Priority**: High  
**Estimated Time**: 4-6 hours

**File**: `/src/components/ui/InteractiveMap.tsx`

**Features**:
- Display map with default center/zoom
- Accept activities as props
- Render markers for each venue
- Responsive container
- Loading state
- Error handling

**Props Interface**:
```typescript
interface InteractiveMapProps {
  activities: DateActivity[]
  activeActivity?: number
  onActivityClick?: (activityIndex: number) => void
  className?: string
}
```

### Task 2.2: Map Markers and Popups
**Priority**: High  
**Estimated Time**: 3-4 hours

**Features**:
- Custom markers with activity numbers (1, 2, 3...)
- Different marker colors/styles based on activity type
- Popups showing:
  - Venue name
  - Activity time
  - Estimated cost
  - Brief description
- Click handlers to sync with timeline

### Task 2.3: Auto-fit and Centering
**Priority**: Medium  
**Estimated Time**: 2-3 hours

**Features**:
- Calculate bounds from all activity coordinates
- Auto-zoom to fit all markers
- Handle edge cases (single activity, very close activities)
- Proper padding around markers

## Phase 3: Route Visualization

### Task 3.1: Activity Route Lines
**Priority**: Medium  
**Estimated Time**: 3-4 hours

**Features**:
- Draw lines connecting activities in sequence
- Different line styles for different travel methods
- Show travel time/distance on route segments
- Animated route drawing (optional enhancement)

### Task 3.2: Travel Time Integration
**Priority**: Low  
**Estimated Time**: 2-3 hours

**Features**:
- Display travel time from `travelTimeToNext` property
- Show estimated travel method (walking/driving icons)
- Route optimization suggestions (future enhancement)

## Phase 4: Interactive Features

### Task 4.1: Activity Synchronization
**Priority**: High  
**Estimated Time**: 2-3 hours

**Features**:
- Clicking map marker highlights timeline activity
- Clicking timeline activity centers map on marker
- Active activity styling (highlighted marker)
- Smooth transitions between activities

### Task 4.2: Map Controls
**Priority**: Medium  
**Estimated Time**: 2-3 hours

**Features**:
- Zoom controls
- Toggle between map types (road, satellite, terrain)
- Fullscreen mode
- Current location button (if geolocation available)

### Task 4.3: Mobile Optimization
**Priority**: High  
**Estimated Time**: 3-4 hours

**Features**:
- Touch-friendly controls
- Responsive marker sizes
- Proper popup positioning on small screens
- Swipe gestures (if needed)

## Phase 5: Enhanced Features

### Task 5.1: Alternative Venues
**Priority**: Low  
**Estimated Time**: 4-5 hours

**Features**:
- Show alternative venues from AI response
- Toggle visibility of alternatives
- Different marker style for alternatives
- Compare distances to current route

### Task 5.2: Real-time Data Integration
**Priority**: Low  
**Estimated Time**: 6-8 hours

**Features**:
- Real venue data from Google Places API
- Live traffic data for travel times
- Business hours verification
- Real-time availability (future enhancement)

### Task 5.3: Export and Sharing
**Priority**: Low  
**Estimated Time**: 3-4 hours

**Features**:
- Export map as image
- Generate shareable map links
- Integration with calendar apps for locations
- Print-friendly route summary

## Phase 6: Integration and Testing

### Task 6.1: Replace Placeholder
**Priority**: High  
**Estimated Time**: 1-2 hours

**Steps**:
1. Import InteractiveMap component in date-plan page
2. Replace placeholder div with InteractiveMap
3. Pass activities and activeActivity state
4. Update responsive grid layout if needed

### Task 6.2: Error Handling and Fallbacks
**Priority**: High  
**Estimated Time**: 2-3 hours

**Features**:
- Handle missing coordinates gracefully
- Fallback to address geocoding if coordinates missing
- Network error handling
- Graceful degradation for unsupported browsers

### Task 6.3: Performance Optimization
**Priority**: Medium  
**Estimated Time**: 2-3 hours

**Features**:
- Lazy loading of map component
- Proper cleanup of map instances
- Optimize marker rendering for many activities
- Image optimization for custom markers

### Task 6.4: Testing
**Priority**: High  
**Estimated Time**: 4-6 hours

**Tests**:
- Unit tests for map component
- Integration tests with mock data
- Mobile device testing
- Cross-browser compatibility
- Performance testing with large datasets

## Implementation Order Recommendation

1. **Phase 1**: Setup (Tasks 1.1, 1.2) - Foundation
2. **Phase 2**: Basic Map (Tasks 2.1, 2.2, 2.3) - Core functionality
3. **Phase 6.1**: Replace Placeholder - Quick win to see progress
4. **Phase 4.1**: Activity Sync - Critical user interaction
5. **Phase 6.2**: Error Handling - Stability
6. **Phase 4.3**: Mobile Optimization - User experience
7. **Phase 3**: Route Visualization - Enhancement
8. **Phase 4.2**: Map Controls - Polish
9. **Phase 5**: Enhanced Features - Future improvements
10. **Phase 6**: Remaining testing and optimization

## Technical Considerations

### Data Structure Updates
- Ensure all AI-generated coordinates are valid
- Add fallback geocoding for missing coordinates
- Consider caching geocoded addresses

### Performance
- Implement map clustering for many nearby venues
- Use dynamic imports to reduce initial bundle size
- Optimize marker icons and images

### Accessibility
- Keyboard navigation support
- Screen reader compatibility
- High contrast mode support
- Focus management

### Security
- Validate coordinates before rendering
- Sanitize user input for custom markers
- Rate limiting for geocoding services

## Dependencies and Resources

### Required Packages
```json
{
  "react-leaflet": "^4.2.1",
  "leaflet": "^1.9.4",
  "@types/leaflet": "^1.9.8"
}
```

### Optional Services
- Google Maps Platform (for geocoding/places)
- Mapbox (for advanced styling)
- OpenStreetMap Nominatim (free geocoding)

### External Resources
- Custom marker icons/SVGs
- Map tiles (OpenStreetMap is free)
- Routing service for travel time accuracy

## Success Metrics

- Map loads successfully for all generated date plans
- User can interact with map markers and timeline synchronously
- Mobile experience is smooth and responsive
- Map provides value beyond just showing locations (routes, timing, etc.)
- No significant performance impact on page load time

## Future Enhancements (Post-MVP)

- Real-time traffic integration
- Weather overlay for outdoor activities
- Photo integration for venues
- User-generated content (reviews, photos)
- Social sharing of map routes
- Integration with ride-sharing services
- Offline map support
- Multiple route options
- Activity filtering on map
- Time-based animation of the date progression 