import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Filter, MapPin, Calendar, Clock, Star } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Card, CardContent } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

interface Movie {
  id: string
  title: string
  description: string
  poster_url: string
  duration: number
  language: string
  genre: string
  rating: string
  status: 'now_showing' | 'coming_soon'
  release_date: string
}

interface Theater {
  id: string
  name: string
  location: string
  city: string
}

export default function HomePage() {
  const [movies, setMovies] = useState<Movie[]>([])
  const [theaters, setTheaters] = useState<Theater[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [selectedGenre, setSelectedGenre] = useState('')
  const [selectedFormat, setSelectedFormat] = useState('')

  const fetchMovies = async () => {
    try {
      const moviesData = await blink.db.movies.list({
        orderBy: { created_at: 'desc' }
      })
      setMovies(moviesData as Movie[])
    } catch (error) {
      console.error('Error fetching movies:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTheaters = async () => {
    try {
      const theatersData = await blink.db.theaters.list({
        where: { status: 'approved' },
        orderBy: { name: 'asc' }
      })
      setTheaters(theatersData as Theater[])
    } catch (error) {
      console.error('Error fetching theaters:', error)
    }
  }

  useEffect(() => {
    fetchMovies()
    fetchTheaters()
  }, [])

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesLanguage = !selectedLanguage || movie.language === selectedLanguage
    const matchesGenre = !selectedGenre || movie.genre === selectedGenre
    return matchesSearch && matchesLanguage && matchesGenre
  })

  const nowShowingMovies = filteredMovies.filter(movie => movie.status === 'now_showing')
  const comingSoonMovies = filteredMovies.filter(movie => movie.status === 'coming_soon')

  const languages = [...new Set(movies.map(movie => movie.language))]
  const genres = [...new Set(movies.map(movie => movie.genre))]
  const cities = [...new Set(theaters.map(theater => theater.city))]

  const MovieCard = ({ movie }: { movie: Movie }) => (
    <Card className="movie-card group">
      <div className="relative overflow-hidden">
        <img
          src={movie.poster_url || '/api/placeholder/300/450'}
          alt={movie.title}
          className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="flex items-center gap-2 text-white text-sm mb-2">
            <Clock className="w-4 h-4" />
            <span>{movie.duration} min</span>
            <Star className="w-4 h-4 ml-2" />
            <span>{movie.rating || 'N/A'}</span>
          </div>
          <Link to={`/movie/${movie.id}`}>
            <Button className="w-full bg-primary hover:bg-primary/90">
              Book Now
            </Button>
          </Link>
        </div>
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg mb-2 line-clamp-1">{movie.title}</h3>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="secondary">{movie.language}</Badge>
          <Badge variant="outline">{movie.genre}</Badge>
        </div>
        <p className="text-sm text-muted-foreground line-clamp-2">{movie.description}</p>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading movies...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative h-96 bg-gradient-to-r from-primary/20 to-accent/20 flex items-center">
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            Book Your Perfect
            <span className="text-accent block">Movie Experience</span>
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Discover the latest movies, book your seats, and enjoy the ultimate cinema experience
          </p>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="py-8 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search movies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <Select value={selectedCity} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-40">
                  <MapPin className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Cities</SelectItem>
                  {cities.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Languages</SelectItem>
                  {languages.map(language => (
                    <SelectItem key={language} value={language}>{language}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Genre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Genres</SelectItem>
                  {genres.map(genre => (
                    <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Formats</SelectItem>
                  <SelectItem value="2D">2D</SelectItem>
                  <SelectItem value="3D">3D</SelectItem>
                  <SelectItem value="IMAX">IMAX</SelectItem>
                  <SelectItem value="4DX">4DX</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </section>

      {/* Movies Section */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Tabs defaultValue="now-showing" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="now-showing">Now Showing</TabsTrigger>
              <TabsTrigger value="coming-soon">Coming Soon</TabsTrigger>
            </TabsList>
            
            <TabsContent value="now-showing">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Now Showing</h2>
                <p className="text-muted-foreground">Book your tickets for movies playing now</p>
              </div>
              
              {nowShowingMovies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {nowShowingMovies.map(movie => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No movies currently showing</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="coming-soon">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
                <p className="text-muted-foreground">Get ready for upcoming blockbusters</p>
              </div>
              
              {comingSoonMovies.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {comingSoonMovies.map(movie => (
                    <MovieCard key={movie.id} movie={movie} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No upcoming movies</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  )
}