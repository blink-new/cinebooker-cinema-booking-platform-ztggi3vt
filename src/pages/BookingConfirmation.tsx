import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { CheckCircle, Download, Calendar, MapPin, Clock, Users, QrCode } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Separator } from '../components/ui/separator'

interface Booking {
  id: string
  user_id: string
  showtime_id: string
  seats: string
  total_amount: number
  booking_status: string
  payment_status: string
  qr_code: string
  checked_in: boolean
  created_at: string
}

interface BookingDetails {
  booking: Booking
  movie_title: string
  movie_poster: string
  theater_name: string
  theater_location: string
  screen_name: string
  show_date: string
  show_time: string
  format: string
}

export default function BookingConfirmation() {
  const { bookingId } = useParams<{ bookingId: string }>()
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchBookingDetails = useCallback(async () => {
    try {
      if (!bookingId) return

      // Fetch booking
      const bookings = await blink.db.bookings.list({
        where: { id: bookingId },
        limit: 1
      })

      if (bookings.length === 0) return

      const booking = bookings[0] as Booking

      // Fetch showtime details
      const showtimes = await blink.db.showtimes.list({
        where: { id: booking.showtime_id },
        limit: 1
      })

      if (showtimes.length === 0) return

      const showtime = showtimes[0]

      // Fetch movie, theater, and screen details
      const [movies, theaters, screens] = await Promise.all([
        blink.db.movies.list({ where: { id: showtime.movie_id }, limit: 1 }),
        blink.db.theaters.list({ where: { id: showtime.theater_id }, limit: 1 }),
        blink.db.screens.list({ where: { id: showtime.screen_id }, limit: 1 })
      ])

      setBookingDetails({
        booking,
        movie_title: movies[0]?.title || 'Unknown Movie',
        movie_poster: movies[0]?.poster_url || '',
        theater_name: theaters[0]?.name || 'Unknown Theater',
        theater_location: theaters[0]?.location || 'Unknown Location',
        screen_name: screens[0]?.name || 'Unknown Screen',
        show_date: showtime.show_date,
        show_time: showtime.show_time,
        format: screens[0]?.format || '2D'
      })
    } catch (error) {
      console.error('Error fetching booking details:', error)
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useEffect(() => {
    fetchBookingDetails()
  }, [bookingId, fetchBookingDetails])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (!bookingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Booking not found</p>
          <Link to="/">
            <Button>Go Back Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  const { booking } = bookingDetails
  const seats = JSON.parse(booking.seats)

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-green-600 mb-2">Booking Confirmed!</h1>
          <p className="text-muted-foreground">
            Your tickets have been booked successfully. Show this QR code at the theater for entry.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Ticket Details */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex gap-4">
                  <img
                    src={bookingDetails.movie_poster || '/api/placeholder/120/180'}
                    alt={bookingDetails.movie_title}
                    className="w-20 h-30 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h2 className="text-xl font-semibold mb-2">{bookingDetails.movie_title}</h2>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        <span>{bookingDetails.theater_name} - {bookingDetails.theater_location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(bookingDetails.show_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>
                          {new Date(`2000-01-01T${bookingDetails.show_time}`).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>{bookingDetails.screen_name} • {bookingDetails.format}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3">Booking Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Booking ID:</span>
                      <p className="font-medium">{booking.id}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Booking Date:</span>
                      <p className="font-medium">{new Date(booking.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Selected Seats:</span>
                      <p className="font-medium">{seats.join(', ')}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Amount:</span>
                      <p className="font-medium text-primary">₹{booking.total_amount}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Payment Status:</span>
                      <Badge className={booking.payment_status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {booking.payment_status}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Booking Status:</span>
                      <Badge className={booking.booking_status === 'confirmed' ? 'bg-green-500' : 'bg-red-500'}>
                        {booking.booking_status}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button className="flex-1">
                    <Download className="w-4 h-4 mr-2" />
                    Download Ticket
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Share Ticket
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* QR Code */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-center">Entry QR Code</CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center mx-auto border">
                  <div className="text-center">
                    <QrCode className="w-24 h-24 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">QR Code</p>
                    <p className="text-xs font-mono mt-1">{booking.qr_code}</p>
                  </div>
                </div>
                
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Important Instructions:</p>
                  <ul className="text-left space-y-1">
                    <li>• Show this QR code at the theater entrance</li>
                    <li>• Arrive 30 minutes before showtime</li>
                    <li>• Carry a valid ID proof</li>
                    <li>• QR code is valid for one-time entry only</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <p className="text-xs text-yellow-800 dark:text-yellow-200">
                    <strong>Note:</strong> Screenshots of QR codes are not accepted. Please show the original code from your device.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 text-center space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/">
              <Button variant="outline">Book Another Movie</Button>
            </Link>
            <Link to="/profile">
              <Button variant="outline">View All Bookings</Button>
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Need help? Contact our support team or visit the theater help desk.
          </p>
        </div>
      </div>
    </div>
  )
}