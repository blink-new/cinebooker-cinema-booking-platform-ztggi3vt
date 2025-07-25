import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { blink } from './blink/client'
import { Toaster } from './components/ui/toaster'

// Pages
import HomePage from './pages/HomePage'
import MovieDetails from './pages/MovieDetails'
import SeatSelection from './pages/SeatSelection'
import BookingConfirmation from './pages/BookingConfirmation'
import UserProfile from './pages/UserProfile'
import TheaterDashboard from './pages/TheaterDashboard'
import PlatformDashboard from './pages/PlatformDashboard'
import CheckInInterface from './pages/CheckInInterface'

// Components
import Navbar from './components/layout/Navbar'
import LoadingScreen from './components/ui/LoadingScreen'

interface User {
  id: string
  email: string
  name: string
  role: 'customer' | 'theater_admin' | 'platform_owner'
  theater_id?: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserDetails = async (userId: string) => {
    try {
      const users = await blink.db.users.list({
        where: { id: userId },
        limit: 1
      })
      
      if (users.length > 0) {
        setUser(users[0] as User)
      } else {
        // Create new user record
        const authUser = await blink.auth.me()
        const newUser = await blink.db.users.create({
          id: userId,
          email: authUser.email,
          name: authUser.displayName || authUser.email.split('@')[0],
          role: 'customer'
        })
        setUser(newUser as User)
      }
    } catch (error) {
      console.error('Error fetching user details:', error)
    }
  }

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      if (state.user) {
        // Fetch user details from database
        fetchUserDetails(state.user.id)
      } else {
        setUser(null)
      }
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  if (loading) {
    return <LoadingScreen />
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-4">CineBooker</h1>
          <p className="text-muted-foreground mb-8">Please sign in to continue</p>
          <button
            onClick={() => blink.auth.login()}
            className="bg-primary text-white px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navbar user={user} />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/movie/:id" element={<MovieDetails />} />
            <Route path="/book/:showtimeId" element={<SeatSelection />} />
            <Route path="/booking/:bookingId" element={<BookingConfirmation />} />
            <Route path="/profile" element={<UserProfile user={user} />} />
            
            {/* Theater Admin Routes */}
            {user.role === 'theater_admin' && (
              <Route path="/theater-dashboard" element={<TheaterDashboard user={user} />} />
            )}
            
            {/* Platform Owner Routes */}
            {user.role === 'platform_owner' && (
              <Route path="/platform-dashboard" element={<PlatformDashboard />} />
            )}
            
            <Route path="/check-in" element={<CheckInInterface />} />
          </Routes>
        </main>
        <Toaster />
      </div>
    </Router>
  )
}

export default App