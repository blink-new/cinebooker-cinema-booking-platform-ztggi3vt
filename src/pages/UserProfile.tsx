import { useState, useEffect, useCallback } from 'react'
import { User, Mail, Phone, Calendar, Download, RotateCcw } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useToast } from '../hooks/use-toast'

interface User {
  id: string
  email: string
  name: string
  phone?: string
  role: 'customer' | 'theater_admin' | 'platform_owner'
}

interface Booking {
  id: string
  showtime_id: string
  seats: string
  total_amount: number
  booking_status: string
  payment_status: string
  qr_code: string
  checked_in: boolean
  created_at: string
  movie_title: string
  theater_name: string
  show_date: string
  show_time: string
}

interface UserProfileProps {
  user: User
}

export default function UserProfile({ user }: UserProfileProps) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({
    name: user.name,
    phone: user.phone || ''
  })
  const { toast } = useToast()

  const fetchBookings = useCallback(async () => {
    try {
      const bookingsData = await blink.db.bookings.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' }
      })

      // Enrich bookings with movie and theater details
      const enrichedBookings = await Promise.all(
        bookingsData.map(async (booking: any) => {
          const [showtimes] = await Promise.all([
            blink.db.showtimes.list({ where: { id: booking.showtime_id }, limit: 1 })
          ])

          if (showtimes.length > 0) {
            const showtime = showtimes[0]
            const [movies, theaters] = await Promise.all([
              blink.db.movies.list({ where: { id: showtime.movie_id }, limit: 1 }),
              blink.db.theaters.list({ where: { id: showtime.theater_id }, limit: 1 })
            ])

            return {
              ...booking,
              movie_title: movies[0]?.title || 'Unknown Movie',
              theater_name: theaters[0]?.name || 'Unknown Theater',
              show_date: showtime.show_date,
              show_time: showtime.show_time
            }
          }

          return {
            ...booking,
            movie_title: 'Unknown Movie',
            theater_name: 'Unknown Theater',
            show_date: '',
            show_time: ''
          }
        })
      )

      setBookings(enrichedBookings)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }, [user.id])

  useEffect(() => {
    fetchBookings()
  }, [fetchBookings])

  const handleUpdateProfile = async () => {
    setUpdating(true)
    try {
      await blink.db.users.update(user.id, {
        name: formData.name,
        phone: formData.phone
      })

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully"
      })
    } catch (error) {
      console.error('Error updating profile:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUpdating(false)
    }
  }

  const handleRebook = async (booking: Booking) => {
    // In a real app, this would navigate to seat selection with the same showtime
    toast({
      title: "Rebook Feature",
      description: "This would redirect to seat selection for the same show"
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500'
      case 'cancelled': return 'bg-red-500'
      case 'refunded': return 'bg-yellow-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your account and booking history</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user.email}
                      disabled
                      className="bg-muted"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <div className="flex items-center gap-2">
                      <Badge className="capitalize">
                        {user.role.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={handleUpdateProfile}
                  disabled={updating}
                  className="w-full md:w-auto"
                >
                  {updating ? 'Updating...' : 'Update Profile'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Booking History
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading bookings...</p>
                  </div>
                ) : bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <Card key={booking.id} className="border-l-4 border-l-primary">
                        <CardContent className="p-4">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-semibold">{booking.movie_title}</h3>
                                <Badge 
                                  className={`${getStatusColor(booking.booking_status)} text-white`}
                                >
                                  {booking.booking_status}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Mail className="w-4 h-4" />
                                  <span>{booking.theater_name}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  <span>
                                    {new Date(booking.show_date).toLocaleDateString()} • {' '}
                                    {new Date(`2000-01-01T${booking.show_time}`).toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </span>
                                </div>
                                <div>
                                  <span>Seats: {JSON.parse(booking.seats).join(', ')}</span>
                                </div>
                                <div>
                                  <span className="font-medium">₹{booking.total_amount}</span>
                                </div>
                              </div>
                              
                              <div className="mt-2 text-xs text-muted-foreground">
                                Booked on {new Date(booking.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <div className="flex flex-col gap-2">
                              {booking.booking_status === 'confirmed' && (
                                <>
                                  <Button size="sm" variant="outline">
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Ticket
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleRebook(booking)}
                                  >
                                    <RotateCcw className="w-4 h-4 mr-2" />
                                    Rebook
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No bookings found</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Start by booking your first movie!
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}