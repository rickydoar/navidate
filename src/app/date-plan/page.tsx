'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import InteractiveMap from '@/components/ui/InteractiveMap'
import { AIRecommendationResponse, DateActivity } from '@/types'
import { Clock, MapPin, DollarSign, Star, Users, Calendar, Heart, Share2, Download, RefreshCw } from 'lucide-react'

export default function DatePlanPage() {
  const [datePlan, setDatePlan] = useState<AIRecommendationResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeActivity, setActiveActivity] = useState(0)

  useEffect(() => {
    // Get the generated date plan from localStorage
    const storedPlan = localStorage.getItem('generatedDatePlan')
    if (storedPlan) {
      try {
        const parsedPlan = JSON.parse(storedPlan)
        setDatePlan(parsedPlan)
      } catch (error) {
        console.error('Failed to parse stored date plan:', error)
      }
    }
    setIsLoading(false)
  }, [])

  const formatTime = (timeString: string) => {
    // Handle both old format (ISO) and new format (HH:MM)
    if (timeString.includes('T') || timeString.includes('Z')) {
      // Old ISO format
      return new Date(timeString).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    } else {
      // New HH:MM format
      const [hours, minutes] = timeString.split(':')
      const hour24 = parseInt(hours)
      const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
      const ampm = hour24 >= 12 ? 'PM' : 'AM'
      return `${hour12}:${minutes} ${ampm}`
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getPriceLevelText = (level: number) => {
    return '$'.repeat(level)
  }

  const getDateTypeColor = (dateType: string) => {
    const colors = {
      romantic: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-300',
      casual: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
      adventurous: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
      cultural: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
      active: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
      relaxed: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300'
    }
    return colors[dateType as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
  }

  const handleShare = () => {
    if (navigator.share && datePlan) {
      navigator.share({
        title: datePlan.itinerary.title,
        text: datePlan.itinerary.description,
        url: window.location.href,
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    }
  }

  const handleDownload = async () => {
    if (!datePlan) return
    
    try {
      // Dynamic imports to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default
      const jsPDF = (await import('jspdf')).default
      
      // Hide the header and any fixed elements that shouldn't be in PDF
      const header = document.querySelector('header')
      const originalHeaderDisplay = header?.style.display
      if (header) header.style.display = 'none'
      
             // Get the main content container
       const contentElement = document.getElementById('date-plan-content')
      
      if (!contentElement) {
        throw new Error('Content element not found')
      }
      
      // Temporarily hide elements that shouldn't be in the PDF
      const elementsToHide = [
        'nav', // Navigation elements
        '[class*="sticky"]', // Sticky elements
        '[class*="fixed"]', // Fixed elements
        'button:has([class*="Share"])', // Share button
        'button:has([class*="Download"])', // Download button
      ]
      
      const hiddenElements: Array<{ element: HTMLElement; originalDisplay: string }> = []
      
      elementsToHide.forEach(selector => {
        const elements = document.querySelectorAll(selector)
        elements.forEach(el => {
          const htmlEl = el as HTMLElement
          if (htmlEl && htmlEl !== header) {
            hiddenElements.push({ 
              element: htmlEl, 
              originalDisplay: htmlEl.style.display 
            })
            htmlEl.style.display = 'none'
          }
        })
      })
      
             // Create PDF with high quality settings
       const canvas = await html2canvas(contentElement as HTMLElement, {
         useCORS: true,
         allowTaint: true,
         backgroundColor: '#ffffff',
         logging: false,
         height: contentElement.scrollHeight,
         width: contentElement.scrollWidth,
         scrollX: 0,
         scrollY: 0,
       } as any)
      
      // Restore hidden elements
      if (header && originalHeaderDisplay !== undefined) {
        header.style.display = originalHeaderDisplay
      }
      
      hiddenElements.forEach(({ element, originalDisplay }) => {
        element.style.display = originalDisplay
      })
      
      // Calculate dimensions
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const margin = 10
      const contentWidth = pdfWidth - (margin * 2)
      
      // Calculate scaling to fit content width
      const canvasAspectRatio = canvas.height / canvas.width
      const contentHeight = contentWidth * canvasAspectRatio
      
      // If content fits on one page
      if (contentHeight <= pdfHeight - (margin * 2)) {
        pdf.addImage(imgData, 'PNG', margin, margin, contentWidth, contentHeight)
      } else {
        // Split content across multiple pages
        const pageHeight = pdfHeight - (margin * 2)
        const totalPages = Math.ceil(contentHeight / pageHeight)
        
        for (let i = 0; i < totalPages; i++) {
          if (i > 0) {
            pdf.addPage()
          }
          
          // Calculate the portion of the canvas for this page
          const sourceY = (canvas.height * i * pageHeight) / contentHeight
          const sourceHeight = Math.min(
            (canvas.height * pageHeight) / contentHeight,
            canvas.height - sourceY
          )
          
          // Create a temporary canvas for this page slice
          const pageCanvas = document.createElement('canvas')
          const pageCtx = pageCanvas.getContext('2d')!
          
          pageCanvas.width = canvas.width
          pageCanvas.height = sourceHeight
          
          // Fill with white background
          pageCtx.fillStyle = '#ffffff'
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)
          
          // Draw the slice of the original canvas
          pageCtx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, pageCanvas.width, pageCanvas.height
          )
          
          const pageImgData = pageCanvas.toDataURL('image/png')
          const pageImgHeight = (pageCanvas.height * contentWidth) / pageCanvas.width
          
          pdf.addImage(pageImgData, 'PNG', margin, margin, contentWidth, pageImgHeight)
        }
      }
      
      // Add footer with page numbers
      const totalPages = (pdf as any).getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i)
        pdf.setFontSize(8)
        pdf.setTextColor(128, 128, 128)
        
        // Add footer text
        const footerText = `Generated by Navidate | Page ${i} of ${totalPages}`
        const confidenceText = `Confidence Score: ${Math.round(datePlan.confidence * 100)}%`
        
        pdf.text(footerText, margin, pdfHeight - 5)
        
        // Right-align confidence score
        const textWidth = pdf.getTextWidth(confidenceText)
        pdf.text(confidenceText, pdfWidth - margin - textWidth, pdfHeight - 5)
      }
      
      // Save the PDF
      const fileName = `${datePlan.itinerary.title.replace(/\s+/g, '-').toLowerCase()}-date-plan.pdf`
      pdf.save(fileName)
      
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert('Failed to generate PDF. Please try again.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-gray-600 dark:text-gray-300">Loading your perfect date plan...</p>
        </div>
      </div>
    )
  }

  if (!datePlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
        <header className="px-4 lg:px-6 h-14 flex items-center border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
          <Link className="flex items-center justify-center" href="/">
            <span className="text-2xl font-bold text-primary">Navidate</span>
          </Link>
        </header>
        
        <div className="container mx-auto px-4 py-8 max-w-4xl text-center">
          <div className="bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 rounded-2xl p-12 shadow-xl">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-12 h-12 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              No Date Plan Found
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
              It looks like you haven't generated a date plan yet. Let's create something amazing!
            </p>
            <Link href="/plan">
              <Button size="lg" className="px-8 py-3 text-lg">
                <Heart className="w-5 h-5 mr-2" />
                Plan Your Perfect Date
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const { itinerary, reasoning, confidence } = datePlan

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="px-4 lg:px-6 h-16 flex items-center border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80 sticky top-0 z-50">
        <Link className="flex items-center justify-center" href="/">
          <span className="text-2xl font-bold text-primary">Navidate</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Button variant="ghost" size="sm" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Link href="/date-plan/edit">
            <Button variant="outline" size="sm">
              Edit Plan
            </Button>
          </Link>
          <Link href="/plan">
            <Button variant="outline" size="sm">
              Plan Another
            </Button>
          </Link>
        </nav>
      </header>

      <div id="date-plan-content" className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 mb-4">
            <Badge className={getDateTypeColor(itinerary.preferences.dateType)}>
              {itinerary.preferences.dateType}
            </Badge>
            <Badge variant="secondary">
              <Users className="w-3 h-3 mr-1" />
              {itinerary.preferences.groupSize} {itinerary.preferences.groupSize === 1 ? 'person' : 'people'}
            </Badge>
          </div>
          
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-6 leading-tight">
            {itinerary.title}
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            {itinerary.description}
          </p>
          
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 px-4 py-2 rounded-full">
              <DollarSign className="w-4 h-4 text-green-600" />
              <span className="font-medium">
                {formatCurrency(itinerary.totalCost.min)} - {formatCurrency(itinerary.totalCost.max)}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 px-4 py-2 rounded-full">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-medium">
                {Math.floor(itinerary.totalDuration / 60)}h {itinerary.totalDuration % 60}m
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 dark:bg-gray-800/60 px-4 py-2 rounded-full">
              <Star className="w-4 h-4 text-yellow-600" />
              <span className="font-medium">
                {Math.round(confidence * 100)}% Match
              </span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Timeline */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Your Date Timeline</h2>
            
            {itinerary.activities.map((activity: DateActivity, index: number) => (
              <Card 
                key={activity.id} 
                className={`shadow-xl border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90 transition-all duration-300 cursor-pointer ${
                  activeActivity === index ? 'ring-2 ring-primary scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
                onClick={() => setActiveActivity(index)}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          activeActivity === index ? 'bg-primary' : 'bg-gray-400'
                        }`}>
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <CardTitle className="text-xl text-gray-900 dark:text-white mb-2">
                          {activity.venue.name}
                        </CardTitle>
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatTime(activity.startTime)} - {formatTime(activity.endTime)}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {activity.venue.category}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 dark:text-white">
                        {formatCurrency(activity.estimatedCost)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {getPriceLevelText(activity.venue.priceLevel)}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">
                    {activity.description}
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600 dark:text-gray-400">{activity.venue.address}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-gray-600 dark:text-gray-400">
                          {activity.venue.rating} ({activity.venue.reviewCount} reviews)
                        </span>
                      </div>
                    </div>
                    
                    {activity.venue.description && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        <p><strong>About:</strong> {activity.venue.description}</p>
                      </div>
                    )}
                  </div>

                  {activity.notes && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
                      <p className="text-sm text-blue-800 dark:text-blue-200">
                        <strong>💡 Tip:</strong> {activity.notes}
                      </p>
                    </div>
                  )}

                  {(activity.travelTimeToNext ?? 0) > 0 && index < itinerary.activities.length - 1 && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span>🚗 {activity.travelTimeToNext} minutes to next location</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Interactive Map */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
              <CardHeader>
                <CardTitle className="text-lg text-gray-900 dark:text-white">
                  Route Map
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InteractiveMap 
                  activities={itinerary.activities}
                  activeActivity={activeActivity}
                  onActivityClick={setActiveActivity}
                  className="aspect-square"
                />
              </CardContent>
            </Card>

            {/* AI Insights */}
            {reasoning && (
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">AI</span>
                    </div>
                    Why This Plan Works
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{reasoning}</p>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {itinerary.tags && itinerary.tags.length > 0 && (
              <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm dark:bg-gray-800/90">
                <CardHeader>
                  <CardTitle className="text-lg text-gray-900 dark:text-white">
                    Date Highlights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {itinerary.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-3">
              <Button 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
                onClick={() => alert('Save functionality coming soon!')}
              >
                <Heart className="w-5 h-5 mr-2" />
                Save This Date Plan
              </Button>
              
              <Link href="/date-plan/edit" className="block">
                <Button variant="outline" size="lg" className="w-full">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Edit This Plan
                </Button>
              </Link>
              
              <Link href="/plan" className="block">
                <Button variant="outline" size="lg" className="w-full">
                  <Calendar className="w-5 h-5 mr-2" />
                  Plan Another Date
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 