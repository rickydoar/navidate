# Navidate Architecture

## Overview
This document outlines the technical architecture and technology stack for Navidate, an AI-powered date planning application. The architecture prioritizes simplicity, developer experience, and rapid development.

## Core Technology Stack

### Frontend Framework
- **Next.js 14 with App Router**
  - Server-side rendering and static generation
  - Built-in API routes for backend functionality
  - File-based routing system
  - Optimized performance and SEO
  - TypeScript support out of the box

### UI Framework & Styling
- **shadcn/ui**
  - Copy-paste component library built on Radix UI
  - Fully customizable and accessible components
  - Built with Tailwind CSS
  - No runtime dependencies
- **Tailwind CSS**
  - Utility-first CSS framework
  - Responsive design utilities
  - Custom design system support
- **Lucide React**
  - Icon library for consistent iconography

### AI Integration
- **OpenAI API**
  - GPT-4 for intelligent date planning recommendations
  - Structured output for consistent response formatting
  - Function calling for venue data integration
  - Cost-effective with usage-based pricing

### Database
- **PostgreSQL**
  - Robust relational database with excellent performance
  - Full ACID compliance and data integrity
  - Advanced features like JSON support and full-text search
  - Excellent ecosystem and tooling support
  - Industry standard for production applications

### ORM & Database Management
- **Prisma ORM**
  - Type-safe database client
  - Automatic TypeScript generation
  - Built-in migration system
  - Excellent developer experience
  - Works seamlessly with PostgreSQL

### Authentication
- **NextAuth.js v5 (Auth.js)**
  - Built for Next.js App Router
  - Multiple provider support (Google, GitHub, Email)
  - Session management
  - CSRF protection
  - Works with PostgreSQL adapter

### External APIs
- **Google Places API**
  - Venue search and details
  - Photos and reviews
  - Location autocomplete
- **Google Maps JavaScript API**
  - Interactive maps
  - Distance calculations
  - Route optimization

### State Management
- **React Server Components + useState/useReducer**
  - Leverage server components for data fetching
  - Minimal client-side state management
  - No additional state management library needed initially

### Form Handling
- **React Hook Form**
  - Performant forms with minimal re-renders
  - Built-in validation
  - TypeScript support
  - Works well with shadcn/ui components

### Validation
- **Zod**
  - TypeScript-first schema validation
  - Runtime type checking
  - Integration with React Hook Form
  - API request/response validation

## Architecture Patterns

### File Structure
```
navidate/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Route groups
│   ├── api/               # API routes
│   ├── dashboard/         # Protected routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
│   ├── ui/               # shadcn/ui components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Utility functions
│   ├── auth.ts           # Auth configuration
│   ├── db.ts             # Database connection
│   ├── openai.ts         # OpenAI client
│   └── utils.ts          # General utilities
├── prisma/               # Database schema
│   ├── schema.prisma     # Prisma schema
│   └── migrations/       # Database migrations
└── types/                # TypeScript type definitions
```

### Data Flow Architecture

#### 1. User Input Flow
```
User Form → Zod Validation → Server Action → Database → AI Processing
```

#### 2. AI Recommendation Flow
```
User Preferences → OpenAI API → Structured Response → Google Places API → Enhanced Results
```

#### 3. Data Persistence Flow
```
Generated Date → Prisma ORM → PostgreSQL Database → User Dashboard
```

## Development Environment

### Required Tools
- **Node.js 18+**
- **npm/yarn/pnpm**
- **Git**
- **Cursor** (recommended)

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/navidate"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="your-openai-api-key"

# Google APIs
GOOGLE_PLACES_API_KEY="your-google-places-key"
GOOGLE_MAPS_API_KEY="your-google-maps-key"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

## Deployment Architecture

### Hosting Platform
- **Vercel**
  - Optimized for Next.js applications
  - Automatic deployments from Git
  - Edge functions for API routes
  - Built-in analytics and monitoring

### Database Hosting
- **Vercel Postgres**
  - Managed PostgreSQL service optimized for Vercel
  - Automatic scaling and connection pooling
  - Built-in backups and point-in-time recovery
  - Generous free tier for development
  - Seamless integration with Vercel deployments

### CDN & Assets
- **Vercel Edge Network**
  - Global CDN for static assets
  - Image optimization
  - Automatic compression

## Security Considerations

### Data Protection
- Environment variables for API keys
- HTTPS enforcement
- CSRF protection via NextAuth.js
- Input validation with Zod
- SQL injection prevention via Prisma

### API Security
- Rate limiting for OpenAI API calls
- Google API key restrictions
- User authentication for protected routes
- Session-based authorization

## Performance Optimizations

### Frontend Performance
- Server Components for reduced JavaScript bundle
- Image optimization with Next.js Image component
- Lazy loading for non-critical components
- Tailwind CSS purging for minimal CSS bundle

### Backend Performance
- PostgreSQL with optimized queries and indexing
- Prisma query optimization and connection pooling
- API response caching
- OpenAI response caching for similar requests

### Monitoring
- Vercel Analytics for performance metrics
- Error tracking with built-in Next.js error handling
- OpenAI usage monitoring

## Scalability Considerations

### Database Scaling Path
1. **Start**: Vercel Postgres (current choice)
2. **Growth**: Optimize queries and add database indexing
3. **Scale**: Add read replicas and advanced connection pooling

### API Scaling
- OpenAI API rate limiting and queuing
- Google Places API quota management
- Implement caching layers as usage grows

### Infrastructure Scaling
- Vercel automatically handles traffic scaling
- Edge functions for global performance
- CDN for static asset delivery

## Why This Architecture?

### Simplicity Benefits
- **Vercel Postgres**: Managed database with zero configuration
- **shadcn/ui**: Copy-paste components, no package dependencies
- **Next.js App Router**: Full-stack in one framework
- **Vercel**: Zero-config deployment

### Developer Experience
- **TypeScript**: End-to-end type safety
- **Prisma**: Type-safe database queries
- **Hot reloading**: Fast development cycles
- **Integrated tooling**: Everything works together seamlessly

### Cost Effectiveness
- **Vercel**: Generous free tier
- **Vercel Postgres**: Free tier for development and small projects
- **OpenAI**: Pay-per-use pricing
- **Google APIs**: Free tier for development

This architecture provides a solid foundation for rapid development while maintaining the flexibility to scale and evolve as Navidate grows. 