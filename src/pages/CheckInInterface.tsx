import { useState } from 'react'
import { QrCode, Scan, CheckCircle, XCircle, User, Calendar, Clock } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { useToast } from '../hooks/use-toast'

interface CheckInResult {
  success: boolean
  booking?: {
    id: string
    movie_title: string
    theater_name: string
    show_date: string
    show_time: string
    seats: string[]
    user_name: string
  }
  message: string
}

export default function CheckInInterface() {
  const [qrCode, setQrCode] = useState('')
  const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleQRScan = async () => {
    if (!qrCode.trim()) {
      toast({
        title: "Invalid QR Code",
        description: "Please enter a valid QR code",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // Find booking by QR code
      const bookings = await blink.db.bookings.list({
        where: { qr_code: qrCode.trim() },
        limit: 1
      })

      if (bookings.length === 0) {
        setCheckInResult({
          success: false,
          message: "Invalid QR code. Booking not found."
        })
        return
      }

      const booking = bookings[0]

      // Check if already checked in
      if (Number(booking.checked_in) > 0) {
        setCheckInResult({
          success: false,
          message: "This ticket has already been used for check-in."
        })
        return
      }

      // Check if booking is confirmed
      if (booking.booking_status !== 'confirmed') {
        setCheckInResult({
          success: false,
          message: "This booking is not confirmed."
        })
        return
      }

      // Fetch additional details
      const [showtimes, users] = await Promise.all([
        blink.db.showtimes.list({ where: { id: booking.showtime_id }, limit: 1 }),
        blink.db.users.list({ where: { id: booking.user_id }, limit: 1 })
      ])

      if (showtimes.length === 0) {
        setCheckInResult({
          success: false,
          message: "Showtime not found."
        })
        return
      }

      const showtime = showtimes[0]
      const [movies, theaters] = await Promise.all([
        blink.db.movies.list({ where: { id: showtime.movie_id }, limit: 1 }),
        blink.db.theaters.list({ where: { id: showtime.theater_id }, limit: 1 })
      ])

      // Update booking as checked in
      await blink.db.bookings.update(booking.id, {
        checked_in: true,
        check_in_time: new Date().toISOString()
      })

      setCheckInResult({
        success: true,
        booking: {
          id: booking.id,
          movie_title: movies[0]?.title || 'Unknown Movie',
          theater_name: theaters[0]?.name || 'Unknown Theater',
          show_date: showtime.show_date,
          show_time: showtime.show_time,
          seats: JSON.parse(booking.seats),
          user_name: users[0]?.name || 'Unknown User'
        },
        message: "Check-in successful!"
      })

      toast({
        title: "Check-in Successful",
        description: "Customer has been checked in successfully"
      })

    } catch (error) {
      console.error('Error during check-in:', error)
      setCheckInResult({
        success: false,
        message: "An error occurred during check-in. Please try again."
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setQrCode('')
    setCheckInResult(null)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Check-in Interface</h1>
          <p className="text-muted-foreground">Scan QR codes to check in customers</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* QR Scanner */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-5 h-5" />
                QR Code Scanner
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Enter QR Code</label>
                <Input
                  placeholder="Scan or enter QR code manually"
                  value={qrCode}
                  onChange={(e) => setQrCode(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleQRScan()}
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={handleQRScan}
                  disabled={loading || !qrCode.trim()}
                  className="flex-1"
                >
                  <Scan className="w-4 h-4 mr-2" />
                  {loading ? 'Checking...' : 'Check In'}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>

              <div className="text-center p-8 border-2 border-dashed border-muted rounded-lg">
                <QrCode className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Camera scanner coming soon
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  For now, manually enter the QR code above
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Check-in Result */}
          <Card>
            <CardHeader>
              <CardTitle>Check-in Status</CardTitle>
            </CardHeader>
            <CardContent>
              {checkInResult ? (
                <div className="space-y-4">
                  <div className={`flex items-center gap-2 p-4 rounded-lg ${
                    checkInResult.success 
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200'
                  }`}>
                    {checkInResult.success ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <XCircle className="w-5 h-5" />
                    )}
                    <span className="font-medium">{checkInResult.message}</span>
                  </div>

                  {checkInResult.success && checkInResult.booking && (
                    <div className="space-y-4 p-4 bg-card rounded-lg border">
                      <h3 className="font-semibold text-lg">Booking Details</h3>
                      
                      <div className="grid grid-cols-1 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Customer:</span>
                          <span>{checkInResult.booking.user_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Movie:</span>
                          <span>{checkInResult.booking.movie_title}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Theater:</span>
                          <span>{checkInResult.booking.theater_name}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Date:</span>
                          <span>{new Date(checkInResult.booking.show_date).toLocaleDateString()}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">Time:</span>
                          <span>
                            {new Date(`2000-01-01T${checkInResult.booking.show_time}`).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Seats:</span>
                          <div className="flex gap-1">
                            {checkInResult.booking.seats.map((seat, index) => (
                              <Badge key={index} variant="secondary">{seat}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        Checked in at: {new Date().toLocaleString()}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Scan className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Scan a QR code to check in customers</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    The check-in status will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Check-in Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-medium mb-2">For Staff:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Ask customers to show their QR code</li>
                  <li>• Scan or manually enter the QR code</li>
                  <li>• Verify customer identity if needed</li>
                  <li>• Direct customers to their seats</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Important Notes:</h4>
                <ul className="space-y-1 text-muted-foreground">
                  <li>• Each QR code can only be used once</li>
                  <li>• Check-in is only valid for confirmed bookings</li>
                  <li>• Screenshots are not accepted</li>
                  <li>• Contact support for any issues</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}