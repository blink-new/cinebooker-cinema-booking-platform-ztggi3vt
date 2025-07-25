import { useState, useEffect } from 'react'
import { Building, Film, Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react'
import { blink } from '../blink/client'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Badge } from '../components/ui/badge'

export default function PlatformDashboard() {
  const [stats, setStats] = useState({
    totalTheaters: 0,
    totalMovies: 0,
    totalUsers: 0,
    totalRevenue: 0
  })

  const [pendingTheaters, setPendingTheaters] = useState([])

  const fetchDashboardStats = async () => {
    try {
      // Fetch platform-wide statistics
      setStats({
        totalTheaters: 25,
        totalMovies: 150,
        totalUsers: 12500,
        totalRevenue: 2500000
      })

      // Fetch pending theater approvals
      const theaters = await blink.db.theaters.list({
        where: { status: 'pending' },
        orderBy: { created_at: 'desc' }
      })
      setPendingTheaters(theaters)
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const handleTheaterApproval = async (theaterId: string, status: 'approved' | 'rejected') => {
    try {
      await blink.db.theaters.update(theaterId, { status })
      fetchDashboardStats() // Refresh data
    } catch (error) {
      console.error('Error updating theater status:', error)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Platform Dashboard</h1>
          <p className="text-muted-foreground">Manage the entire CineBooker platform</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Theaters</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTheaters}</div>
              <p className="text-xs text-muted-foreground">+3 this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Movies</CardTitle>
              <Film className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMovies}</div>
              <p className="text-xs text-muted-foreground">+12 this month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">+15% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{(stats.totalRevenue / 100000).toFixed(1)}L</div>
              <p className="text-xs text-muted-foreground">+22% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="theaters" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="theaters">Theaters</TabsTrigger>
            <TabsTrigger value="movies">Movies</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="theaters" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Theater Approvals</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingTheaters.length > 0 ? (
                  <div className="space-y-4">
                    {pendingTheaters.map((theater: any) => (
                      <div key={theater.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <h3 className="font-semibold">{theater.name}</h3>
                          <p className="text-sm text-muted-foreground">{theater.location}, {theater.city}</p>
                          <p className="text-xs text-muted-foreground">Applied: {new Date(theater.created_at).toLocaleDateString()}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleTheaterApproval(theater.id, 'approved')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleTheaterApproval(theater.id, 'rejected')}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No pending theater approvals</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="movies" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Movie Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Film className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Movie management interface coming soon</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Add new movies, manage genres, and control movie listings
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Advanced analytics coming soon</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Platform-wide metrics, revenue analytics, and performance insights
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