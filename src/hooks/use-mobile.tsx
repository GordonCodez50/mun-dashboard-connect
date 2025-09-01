
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    // Check both screen width AND user agent for mobile detection
    const isMobileWidth = window.innerWidth < MOBILE_BREAKPOINT
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    return isMobileWidth || isMobileDevice
  })

  React.useEffect(() => {
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < MOBILE_BREAKPOINT
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      setIsMobile(isMobileWidth || isMobileDevice)
    }
    
    // Initial check
    checkMobile()
    
    // Add resize listener
    window.addEventListener('resize', checkMobile)
    
    // Clean up
    return () => {
      window.removeEventListener('resize', checkMobile)
    }
  }, [])

  return isMobile
}
