import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Film, User, Menu, X, LogOut, Settings, BarChart3, Calendar } from 'lucide-react'
import { blink } from '../../blink/client'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet'

interface User {
  id: string
  email: string
  name: string
  role: 'customer' | 'theater_admin' | 'platform_owner'
  theater_id?: string
}

interface NavbarProps {
  user: User
}

export default function Navbar({ user }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const handleLogout = () => {
    blink.auth.logout()
  }

  const getRoleBasedNavItems = () => {
    const baseItems = [
      { href: '/', label: 'Movies', icon: Film },
      { href: '/profile', label: 'Profile', icon: User },
    ]

    if (user.role === 'theater_admin') {
      baseItems.push({ href: '/theater-dashboard', label: 'Dashboard', icon: BarChart3 })
      baseItems.push({ href: '/check-in', label: 'Check-in', icon: Calendar })
    }

    if (user.role === 'platform_owner') {
      baseItems.push({ href: '/platform-dashboard', label: 'Platform', icon: Settings })
    }

    return baseItems
  }

  const navItems = getRoleBasedNavItems()

  const NavLinks = ({ mobile = false }) => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon
        const isActive = location.pathname === item.href
        return (
          <Link
            key={item.href}
            to={item.href}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              isActive
                ? 'bg-primary text-white'
                : 'text-foreground hover:bg-muted'
            } ${mobile ? 'w-full' : ''}`}
            onClick={() => mobile && setMobileMenuOpen(false)}
          >
            <Icon className="w-4 h-4" />
            {item.label}
          </Link>
        )
      })}
    </>
  )

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-foreground">CineBooker</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <NavLinks />
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden sm:block">{user.name}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-accent capitalize">{user.role.replace('_', ' ')}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild className="md:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex items-center gap-2 mb-8">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <Film className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xl font-bold">CineBooker</span>
                </div>
                <div className="flex flex-col gap-2">
                  <NavLinks mobile />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  )
}