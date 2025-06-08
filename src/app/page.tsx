import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="/">
          <span className="text-2xl font-bold text-primary">Navidate</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#features">
            Features
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="#how-it-works">
            How It Works
          </Link>
          <Link className="text-sm font-medium hover:underline underline-offset-4" href="/plan">
            Start Planning
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Plan Perfect Dates with{' '}
                  <span className="text-primary">AI</span>
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Get personalized date recommendations based on your budget, time, location, and preferences. 
                  From romantic dinners to adventurous activities, we&apos;ve got you covered.
                </p>
              </div>
              <div className="space-x-4">
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  href="/plan"
                >
                  Start Planning Your Date
                </Link>
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                  href="#how-it-works"
                >
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Why Choose Navidate?
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Our AI-powered platform takes the guesswork out of date planning with personalized recommendations.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-xl">🤖</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">AI-Powered Recommendations</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Get personalized suggestions based on your preferences, budget, and location.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-xl">📍</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Location-Based Planning</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Find the best restaurants, activities, and venues in your area.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <span className="text-xl">💰</span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Budget-Friendly Options</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Set your budget and get recommendations that fit your financial comfort zone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  How It Works
                </h2>
                <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Planning your perfect date is just three simple steps away.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-3 lg:gap-12">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  1
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Tell Us Your Preferences</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Share your budget, time available, location, and what kind of date you&apos;re looking for.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  2
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Get AI Recommendations</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Our AI analyzes your preferences and suggests personalized date activities and venues.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  3
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">Enjoy Your Perfect Date</h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Follow your personalized itinerary and create unforgettable memories.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 Navidate. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="/privacy">
            Privacy Policy
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="/terms">
            Terms of Service
          </Link>
        </nav>
      </footer>
    </div>
  )
} 