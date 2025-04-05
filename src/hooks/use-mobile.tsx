
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  )

  React.useEffect(() => {
    // Set initial state based on window width
    const checkMobile = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // Check immediately
    checkMobile()
    
    // Set up media query listener
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    // Use the appropriate event listener based on browser support
    const handleChange = () => checkMobile()
    
    // Add event listener
    mql.addEventListener("change", handleChange)
    
    // Also listen for resize events as a fallback
    window.addEventListener('resize', handleChange)
    
    // Clean up
    return () => {
      mql.removeEventListener("change", handleChange)
      window.removeEventListener('resize', handleChange)
    }
  }, [])

  return isMobile
}
