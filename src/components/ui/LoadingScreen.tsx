import { Film } from 'lucide-react'

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-8">
          <Film className="w-16 h-16 text-primary mx-auto animate-pulse" />
          <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
        </div>
        <h1 className="text-4xl font-bold text-primary mb-2">CineBooker</h1>
        <p className="text-muted-foreground">Loading your cinema experience...</p>
      </div>
    </div>
  )
}