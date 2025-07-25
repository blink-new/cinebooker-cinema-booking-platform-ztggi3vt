import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Calendar, Clock, Star, MapPin, Play, Users } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

interface Movie {
  id: string
  title: string
  description: string
  poster_url: string
  trailer_url: string
  duration: number
  language: string
  genre: string
  rating: string
  release_date: string
  status: 'now_showing' | 'coming_soon'
  cast_crew: string
}

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
  theater_name: string
  screen_name: string
  theater_location: string
  format: string
}

interface Review {
  id: string
  user_id: string
  rating: number
  review_text: string
  created_at: string
  user_name: string
}

export default function MovieDetails() {
  const { id } = useParams<{ id: string }>()
  const [movie, setMovie] = useState<Movie | null>(null)
  const [showtimes, setShowtimes] = useState<Showtime[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const fetchMovieDetails = useCallback(async () => {
    try {
      const movies = await blink.db.movies.list({
        where: { id },
        limit: 1
      })
      if (movies.length > 0) {
        setMovie(movies[0] as Movie)
      }
    } catch (error) {
      console.error('Error fetching movie details:', error)
    }
  }, [id])

  const fetchShowtimes = useCallback(async () => {
    try {
      // Get showtimes with theater and screen details
      const showtimesData = await blink.db.showtimes.list({
        where: { 
          movie_id: id,
          show_date: selectedDate
        },
        orderBy: { show_time: 'asc' }
      })

      // Fetch theater and screen details for each showtime
      const enrichedShowtimes = await Promise.all(
        showtimesData.map(async (showtime: any) => {
          const [theaters, screens] = await Promise.all([
            blink.db.theaters.list({ where: { id: showtime.theater_id }, limit: 1 }),
            blink.db.screens.list({ where: { id: showtime.screen_id }, limit: 1 })
          ])
          
          return {
            ...showtime,
            theater_name: theaters[0]?.name || 'Unknown Theater',
            theater_location: theaters[0]?.location || 'Unknown Location',
            screen_name: screens[0]?.name || 'Unknown Screen',
            format: screens[0]?.format || '2D'
          }
        })
      )

      setShowtimes(enrichedShowtimes)
    } catch (error) {
      console.error('Error fetching showtimes:', error)
    } finally {
      setLoading(false)
    }
  }, [id, selectedDate])

  const fetchReviews = useCallback(async () => {
    try {
      const reviewsData = await blink.db.reviews.list({
        where: { movie_id: id },
        orderBy: { created_at: 'desc' },
        limit: 10
      })

      // Fetch user details for each review
      const enrichedReviews = await Promise.all(
        reviewsData.map(async (review: any) => {
          const users = await blink.db.users.list({ 
            where: { id: review.user_id }, 
            limit: 1 
          })
          return {
            ...review,
            user_name: users[0]?.name || 'Anonymous'
          }
        })
      )

      setReviews(enrichedReviews)
    } catch (error) {
      console.error('Error fetching reviews:', error)
    }
  }, [id])

  const getNextSevenDays = () => {
    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date()
      date.setDate(date.getDate() + i)
      dates.push({
        value: date.toISOString().split('T')[0],
        label: date.toLocaleDateString('en-US', { 
          weekday: 'short', 
          month: 'short', 
          day: 'numeric' 
        })
      })
    }
    return dates
  }

  const groupedShowtimes = showtimes.reduce((acc, showtime) => {
    const key = `${showtime.theater_name}-${showtime.theater_location}`
    if (!acc[key]) {
      acc[key] = {
        theater: showtime.theater_name,
        location: showtime.theater_location,
        shows: []
      }
    }
    acc[key].shows.push(showtime)
    return acc
  }, {} as Record<string, { theater: string; location: string; shows: Showtime[] }>)

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : 'N/A'

  useEffect(() => {
    if (id) {
      fetchMovieDetails()
      fetchShowtimes()
      fetchReviews()
    }
  }, [id, selectedDate, fetchMovieDetails, fetchShowtimes, fetchReviews])

  if (loading || !movie) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading movie details...</p>
        </div>
      </div>
    )
  }

  const castCrew = movie.cast_crew ? JSON.parse(movie.cast_crew) : { cast: [], director: '' }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-to-r from-black/80 to-black/40">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${movie.poster_url})` }}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="w-48 h-72 object-cover rounded-lg shadow-2xl"
            />
            <div className="flex-1 text-white">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">{movie.title}</h1>
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <Badge className="bg-primary text-white">{movie.language}</Badge>
                <Badge variant="outline" className="text-white border-white">{movie.genre}</Badge>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{movie.duration} min</span>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span>{averageRating}</span>
                </div>
              </div>
              <p className="text-lg mb-6 max-w-2xl">{movie.description}</p>
              {movie.trailer_url && (
                <Button className="bg-primary hover:bg-primary/90">
                  <Play className="w-4 h-4 mr-2" />
                  Watch Trailer
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="showtimes" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-8">
              <TabsTrigger value="showtimes">Showtimes</TabsTrigger>
              <TabsTrigger value="cast">Cast & Crew</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>

            <TabsContent value="showtimes">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">Select Date & Time</h2>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {getNextSevenDays().map(date => (
                    <Button
                      key={date.value}
                      variant={selectedDate === date.value ? "default" : "outline"}
                      onClick={() => setSelectedDate(date.value)}
                      className="whitespace-nowrap"
                    >
                      {date.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                {Object.entries(groupedShowtimes).map(([key, theater]) => (
                  <Card key={key}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-primary" />
                        {theater.theater} - {theater.location}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {theater.shows.map(show => (
                          <Link
                            key={show.id}
                            to={`/book/${show.id}`}
                            className="block"
                          >
                            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 hover:border-primary">
                              <CardContent className="p-4">
                                <div className="text-center">
                                  <div className="text-lg font-semibold mb-1">
                                    {new Date(`2000-01-01T${show.show_time}`).toLocaleTimeString('en-US', {
                                      hour: 'numeric',
                                      minute: '2-digit',
                                      hour12: true
                                    })}
                                  </div>
                                  <div className="text-sm text-muted-foreground mb-2">
                                    {show.screen_name} • {show.format}
                                  </div>
                                  <div className="flex items-center justify-center gap-1 text-sm">
                                    <Users className="w-4 h-4" />
                                    <span>{show.available_seats}/{show.total_seats}</span>
                                  </div>
                                  <div className="text-sm font-medium text-primary mt-2">
                                    ₹{show.price_regular}+
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {Object.keys(groupedShowtimes).length === 0 && (
                  <div className="text-center py-12">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No showtimes available for selected date</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="cast">
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Director</h3>
                  <p className="text-muted-foreground">{castCrew.director || 'Not available'}</p>
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold mb-4">Cast</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {castCrew.cast && castCrew.cast.length > 0 ? (
                      castCrew.cast.map((actor: string, index: number) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-card rounded-lg">
                          <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                            <Users className="w-6 h-6 text-primary" />
                          </div>
                          <span className="font-medium">{actor}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted-foreground">Cast information not available</p>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews">
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="flex items-center gap-2">
                    <Star className="w-6 h-6 text-yellow-400" />
                    <span className="text-2xl font-bold">{averageRating}</span>
                    <span className="text-muted-foreground">({reviews.length} reviews)</span>
                  </div>
                </div>

                <div className="space-y-4">
                  {reviews.length > 0 ? (
                    reviews.map(review => (
                      <Card key={review.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-medium">
                                  {review.user_name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-medium">{review.user_name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <p className="text-muted-foreground">{review.review_text}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <Star className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}