import { createClient } from '@blinkdotnew/sdk'

export const blink = createClient({
  projectId: 'cinebooker-cinema-booking-platform-ztggi3vt',
  authRequired: true
})

// Debug: Log client initialization
console.log('Blink client initialized with project ID:', 'cinebooker-cinema-booking-platform-ztggi3vt')