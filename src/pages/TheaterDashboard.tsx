import { useState, useEffect } from 'react'
import { BarChart3, Calendar, Users, DollarSign, Plus, Settings } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'

interface User {
  id: string
  email: string
  name: string
  role: 'customer' | 'theater_admin' | 'platform_owner'
  theater_id?: string
}

interface TheaterDashboardProps {
  user: User
}

export default function TheaterDashboard({ user }: TheaterDashboardProps) {
  const [stats, setStats] = useState({
    totalBookings: 0,
    todayRevenue: 0,
    occupancyRate: 0,
    upcomingShows: 0
  })

  const fetchDashboardStats = async () => {
    try {
      // Fetch theater-specific statistics
      // This would be implemented with proper queries
      setStats({
        totalBookings: 156,
        todayRevenue: 45600,
        occupancyRate: 78,
        upcomingShows: 12
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Theater Dashboard</h1>
          <p className="text-muted-foreground">Manage your theater operations and view analytics</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalBookings}</div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats.todayRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+8% from yesterday</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
              <p className="text-xs text-muted-foreground">+5% from last week</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Shows</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.upcomingShows}</div>
              <p className="text-xs text-muted-foreground">Next 7 days</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="shows" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="shows">Shows</TabsTrigger>
            <TabsTrigger value="screens">Screens</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="shows" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Show Management</CardTitle>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Show
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Show management interface coming soon</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Schedule showtimes, set pricing, and manage movie listings
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="screens" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Screen Management</CardTitle>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Screen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Screen management interface coming soon</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Configure screens, seat layouts, and technical specifications
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Reports</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Advanced analytics coming soon</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Revenue reports, occupancy trends, and performance metrics
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}