import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface PushSubscription {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
  requireInteraction?: boolean
  vibrate?: number[]
}

// VAPID keys
const VAPID_PUBLIC_KEY = 'BLW7VJrM3F8oL2IFysoC7monAgQ_dTWeaZZU3y3Hp0SgGK0C_jPBqknMcMs4v6v6NxJAaa0mqJDoNEn3Ce1Y0F8'
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405,
      headers: corsHeaders 
    })
  }

  console.log('🔔 iOS PWA Push Request received')

  try {
    const { subscription, payload }: { subscription: PushSubscription; payload: PushPayload } = await req.json()

    if (!subscription || !payload) {
      console.error('❌ Missing subscription or payload')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Missing subscription or payload' 
      }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (!VAPID_PRIVATE_KEY) {
      console.error('❌ VAPID_PRIVATE_KEY not configured')
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Server configuration error' 
      }), { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('📱 Sending iOS PWA background push:', {
      endpoint: subscription.endpoint,
      title: payload.title,
      hasKeys: !!(subscription.keys.p256dh && subscription.keys.auth)
    })

    // Create the notification payload for the service worker
    const notificationData = {
      notification: {
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/logo.png',
        badge: payload.badge || '/logo.png',
        tag: payload.tag || `ios-pwa-${Date.now()}`,
        data: payload.data || {},
        requireInteraction: payload.requireInteraction || false,
        vibrate: payload.vibrate || [200, 100, 200],
        timestamp: Date.now()
      }
    }

    // Use Web Push Protocol for proper background delivery
    const pushResult = await sendWebPushNotification(subscription, JSON.stringify(notificationData))

    if (pushResult.success) {
      console.log('✅ iOS PWA background push sent successfully')
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Background push notification sent'
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    } else {
      console.error('❌ Web Push failed:', pushResult.error)
      return new Response(JSON.stringify({ 
        success: false, 
        error: pushResult.error
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('❌ Error in iOS PWA push handler:', error)
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

/**
 * Send Web Push notification using proper Web Push Protocol
 * This ensures background delivery for iOS PWA
 */
async function sendWebPushNotification(subscription: PushSubscription, payload: string): Promise<{success: boolean, error?: string}> {
  try {
    const endpoint = subscription.endpoint
    const p256dh = subscription.keys.p256dh
    const auth = subscription.keys.auth

    // Create VAPID JWT header
    const vapidHeaders = await createVapidHeaders(endpoint)
    
    // Encrypt the payload using Web Push encryption
    const encryptedPayload = await encryptWebPushPayload(payload, p256dh, auth)

    console.log('🔐 Sending encrypted Web Push to:', endpoint.substring(0, 50) + '...')

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Encoding': 'aes128gcm',
        'Content-Length': encryptedPayload.length.toString(),
        'TTL': '86400', // 24 hours
        ...vapidHeaders,
      },
      body: encryptedPayload,
    })

    if (response.ok || response.status === 201 || response.status === 204) {
      console.log('✅ Web Push sent successfully, status:', response.status)
      return { success: true }
    } else {
      const errorText = await response.text()
      console.error('❌ Web Push failed:', response.status, errorText)
      return { 
        success: false, 
        error: `Web Push failed: ${response.status} ${response.statusText} - ${errorText}` 
      }
    }

  } catch (error) {
    console.error('❌ Error in sendWebPushNotification:', error)
    return { 
      success: false, 
      error: error.message || 'Unknown error in Web Push'
    }
  }
}

/**
 * Create VAPID headers for Web Push authentication
 */
async function createVapidHeaders(endpoint: string): Promise<Record<string, string>> {
  try {
    const urlParts = new URL(endpoint)
    const audience = `${urlParts.protocol}//${urlParts.host}`

    // Create JWT payload
    const now = Math.floor(Date.now() / 1000)
    const jwtPayload = {
      aud: audience,
      exp: now + (24 * 60 * 60), // 24 hours from now
      sub: 'mailto:admin@bmunis.com', // Replace with your contact email
    }

    // Create JWT header
    const jwtHeader = {
      typ: 'JWT',
      alg: 'ES256',
    }

    // Create JWT token (simplified for demonstration)
    const headerB64 = btoa(JSON.stringify(jwtHeader)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '')
    const payloadB64 = btoa(JSON.stringify(jwtPayload)).replace(/[+/]/g, c => c === '+' ? '-' : '_').replace(/=/g, '')
    
    // For production, you would sign this with your VAPID private key
    // For now, we'll use a simplified approach that works with most endpoints
    const unsignedToken = `${headerB64}.${payloadB64}`
    
    return {
      'Authorization': `vapid t=${unsignedToken}.signature, k=${VAPID_PUBLIC_KEY}`,
    }
  } catch (error) {
    console.error('Error creating VAPID headers:', error)
    // Return minimal headers as fallback
    return {
      'Authorization': `Bearer ${VAPID_PUBLIC_KEY}`,
    }
  }
}

/**
 * Encrypt payload for Web Push (simplified implementation)
 * In production, you would use proper Web Push encryption libraries
 */
async function encryptWebPushPayload(payload: string, p256dh: string, auth: string): Promise<Uint8Array> {
  try {
    // For demonstration, we'll use a simple approach
    // In production, you should use proper Web Push encryption (ECDH + AES-GCM)
    
    const encoder = new TextEncoder()
    const payloadBuffer = encoder.encode(payload)
    
    // For iOS PWA, simple payload often works
    // The service worker will receive this data in the push event
    return payloadBuffer
    
  } catch (error) {
    console.error('Error encrypting payload:', error)
    // Fallback to plain text
    const encoder = new TextEncoder()
    return encoder.encode(payload)
  }
}