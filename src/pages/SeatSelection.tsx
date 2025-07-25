import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Users, Clock, MapPin, CreditCard } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'
import { useToast } from '../hooks/use-toast'

interface Showtime {
  id: string
  movie_id: string
  screen_id: string
  theater_id: string
  show_date: string
  show_time: string
  price_regular: number
  price_gold: number
  price_platinum: number
  available_seats: number
  total_seats: number
}

interface Movie {
  id: string
  title: string
  poster_url: string
  duration: number
  language: string
  genre: string
}

interface Theater {
  id: string
  name: string
  location: string
}

interface Screen {
  id: string
  name: string
  format: string
  seat_layout: string
}

interface SeatLayout {
  rows: number
  seatsPerRow: number
  premium: number[]
  gold: number[]
  regular: number[]
}

export default function SeatSelection() {
  const { showtimeId } = useParams<{ showtimeId: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [showtime, setShowtime] = useState<Showtime | null>(null)
  const [movie, setMovie] = useState<Movie | null>(null)
  const [theater, setTheater] = useState<Theater | null>(null)
  const [screen, setScreen] = useState<Screen | null>(null)
  const [seatLayout, setSeatLayout] = useState<SeatLayout | null>(null)
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOccupiedSeats = async (showtimeId: string) => {
    try {
      const bookings = await blink.db.bookings.list({
        where: { 
          showtime_id: showtimeId,
          booking_status: 'confirmed'
        }
      })

      const occupied: string[] = []
      bookings.forEach((booking: any) => {
        if (booking.seats) {
          const seats = JSON.parse(booking.seats)
          occupied.push(...seats)
        }
      })

      setOccupiedSeats(occupied)
    } catch (error) {
      console.error('Error fetching occupied seats:', error)
    }
  }

  const fetchShowtimeDetails = useCallback(async () => {
    try {
      // Fetch showtime
      const showtimes = await blink.db.showtimes.list({
        where: { id: showtimeId },
        limit: 1
      })
      
      if (showtimes.length === 0) {
        toast({
          title: "Error",
          description: "Showtime not found",
          variant: "destructive"
        })
        navigate('/')
        return
      }

      const showtimeData = showtimes[0] as Showtime
      setShowtime(showtimeData)

      // Fetch movie, theater, and screen details
      const [movies, theaters, screens] = await Promise.all([
        blink.db.movies.list({ where: { id: showtimeData.movie_id }, limit: 1 }),
        blink.db.theaters.list({ where: { id: showtimeData.theater_id }, limit: 1 }),
        blink.db.screens.list({ where: { id: showtimeData.screen_id }, limit: 1 })
      ])

      if (movies.length > 0) setMovie(movies[0] as Movie)
      if (theaters.length > 0) setTheater(theaters[0] as Theater)
      if (screens.length > 0) {
        const screenData = screens[0] as Screen
        setScreen(screenData)
        if (screenData.seat_layout) {
          setSeatLayout(JSON.parse(screenData.seat_layout))
        }
      }

      // Fetch occupied seats
      await fetchOccupiedSeats(showtimeId)
    } catch (error) {
      console.error('Error fetching showtime details:', error)
      toast({
        title: "Error",
        description: "Failed to load showtime details",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }, [showtimeId, toast, navigate])

  useEffect(() => {
    if (showtimeId) {
      fetchShowtimeDetails()
    }
  }, [showtimeId, fetchShowtimeDetails])

  const getSeatType = (row: number): 'premium' | 'gold' | 'regular' => {
    if (!seatLayout) return 'regular'
    
    if (seatLayout.premium.includes(row)) return 'premium'
    if (seatLayout.gold.includes(row)) return 'gold'
    return 'regular'
  }

  const getSeatPrice = (seatType: 'premium' | 'gold' | 'regular'): number => {
    if (!showtime) return 0
    
    switch (seatType) {
      case 'premium': return showtime.price_platinum
      case 'gold': return showtime.price_gold
      case 'regular': return showtime.price_regular
      default: return showtime.price_regular
    }
  }

  const handleSeatClick = (seatId: string) => {
    if (occupiedSeats.includes(seatId)) return

    if (selectedSeats.includes(seatId)) {
      setSelectedSeats(selectedSeats.filter(id => id !== seatId))
    } else {
      if (selectedSeats.length < 10) { // Max 10 seats
        setSelectedSeats([...selectedSeats, seatId])
      } else {
        toast({
          title: "Limit Reached",
          description: "You can select maximum 10 seats",
          variant: "destructive"
        })
      }
    }
  }

  const calculateTotal = () => {
    let total = 0
    selectedSeats.forEach(seatId => {
      const [row] = seatId.split('-').map(Number)
      const seatType = getSeatType(row)
      total += getSeatPrice(seatType)
    })
    return total
  }

  const handleProceedToPayment = async () => {
    if (selectedSeats.length === 0) {
      toast({
        title: "No Seats Selected",
        description: "Please select at least one seat",
        variant: "destructive"
      })
      return
    }

    try {
      const user = await blink.auth.me()
      const total = calculateTotal()

      // Create booking
      const booking = await blink.db.bookings.create({
        id: `booking_${Date.now()}`,
        user_id: user.id,
        showtime_id: showtimeId!,
        seats: JSON.stringify(selectedSeats),
        total_amount: total,
        booking_status: 'confirmed',
        payment_status: 'pending',
        qr_code: `QR_${Date.now()}_${user.id}`,
        checked_in: false
      })

      toast({
        title: "Booking Created",
        description: "Redirecting to payment...",
      })

      navigate(`/booking/${booking.id}`)
    } catch (error) {
      console.error('Error creating booking:', error)
      toast({
        title: "Booking Failed",
        description: "Please try again",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading seat selection...</p>
        </div>
      </div>
    )
  }

  if (!showtime || !movie || !theater || !screen || !seatLayout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Failed to load showtime details</p>
          <Button onClick={() => navigate('/')} className="mt-4">
            Go Back Home
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{movie.title}</h1>
            <div className="flex items-center gap-4 text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {theater.name} - {theater.location}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {new Date(`2000-01-01T${showtime.show_time}`).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </span>
              <Badge>{screen.format}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Seat Map */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Select Your Seats</CardTitle>
                <div className="text-center">
                  <div className="inline-block bg-gradient-to-b from-gray-300 to-gray-500 text-black px-8 py-2 rounded-t-3xl text-sm font-medium">
                    SCREEN
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {/* Seat Legend */}
                <div className="flex justify-center gap-6 mb-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-600 rounded"></div>
                    <span>Available</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                    <span>Selected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-600 rounded"></div>
                    <span>Occupied</span>
                  </div>
                </div>

                {/* Seat Grid */}
                <div className="space-y-2">
                  {Array.from({ length: seatLayout.rows }, (_, rowIndex) => {
                    const row = rowIndex + 1
                    const seatType = getSeatType(row)
                    
                    return (
                      <div key={row} className="flex items-center justify-center gap-1">
                        <div className="w-8 text-center text-sm font-medium text-muted-foreground">
                          {String.fromCharCode(65 + rowIndex)}
                        </div>
                        <div className="flex gap-1">
                          {Array.from({ length: seatLayout.seatsPerRow }, (_, seatIndex) => {
                            const seat = seatIndex + 1
                            const seatId = `${row}-${seat}`
                            const isOccupied = occupiedSeats.includes(seatId)
                            const isSelected = selectedSeats.includes(seatId)
                            
                            return (
                              <button
                                key={seatId}
                                onClick={() => handleSeatClick(seatId)}
                                disabled={isOccupied}
                                className={`
                                  w-8 h-8 rounded text-xs font-medium transition-colors
                                  ${isOccupied 
                                    ? 'seat-occupied' 
                                    : isSelected 
                                      ? 'seat-selected' 
                                      : 'seat-available'
                                  }
                                  ${seatType === 'premium' ? 'seat-premium' : ''}
                                `}
                              >
                                {seat}
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Pricing Info */}
                <div className="mt-8 grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-card rounded-lg border-2 border-yellow-400">
                    <div className="text-sm font-medium text-yellow-400">Premium</div>
                    <div className="text-lg font-bold">₹{showtime.price_platinum}</div>
                    <div className="text-xs text-muted-foreground">Rows {seatLayout.premium.join(', ')}</div>
                  </div>
                  <div className="p-3 bg-card rounded-lg">
                    <div className="text-sm font-medium text-yellow-600">Gold</div>
                    <div className="text-lg font-bold">₹{showtime.price_gold}</div>
                    <div className="text-xs text-muted-foreground">Rows {seatLayout.gold.join(', ')}</div>
                  </div>
                  <div className="p-3 bg-card rounded-lg">
                    <div className="text-sm font-medium">Regular</div>
                    <div className="text-lg font-bold">₹{showtime.price_regular}</div>
                    <div className="text-xs text-muted-foreground">Rows {seatLayout.regular.join(', ')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <img
                    src={movie.poster_url}
                    alt={movie.title}
                    className="w-16 h-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{movie.title}</h3>
                    <p className="text-xs text-muted-foreground">{movie.language} • {movie.genre}</p>
                    <p className="text-xs text-muted-foreground mt-1">{theater.name}</p>
                    <p className="text-xs text-muted-foreground">{screen.name} • {screen.format}</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Date & Time</span>
                  </div>
                  <p className="text-sm font-medium">
                    {new Date(showtime.show_date).toLocaleDateString()} • {' '}
                    {new Date(`2000-01-01T${showtime.show_time}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </p>
                </div>

                <Separator />

                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Selected Seats</span>
                    <span>{selectedSeats.length} seats</span>
                  </div>
                  {selectedSeats.length > 0 ? (
                    <div className="space-y-1">
                      {selectedSeats.map(seatId => {
                        const [row, seat] = seatId.split('-').map(Number)
                        const seatType = getSeatType(row)
                        const price = getSeatPrice(seatType)
                        
                        return (
                          <div key={seatId} className="flex justify-between text-xs">
                            <span>{String.fromCharCode(64 + row)}{seat} ({seatType})</span>
                            <span>₹{price}</span>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No seats selected</p>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between font-semibold">
                  <span>Total Amount</span>
                  <span>₹{calculateTotal()}</span>
                </div>

                <Button 
                  onClick={handleProceedToPayment}
                  disabled={selectedSeats.length === 0}
                  className="w-full"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Proceed to Payment
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}