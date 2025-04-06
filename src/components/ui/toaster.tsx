
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Bell, AlertTriangle, MessageSquare, CheckCircle, X } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

export function Toaster() {
  const { toasts } = useToast()
  const isMobile = useIsMobile()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Determine icon based on title or variant
        let Icon = Bell;
        
        if (variant === "destructive") {
          Icon = AlertTriangle;
        } else if (
          (typeof title === 'string' && title.toLowerCase().includes('reply')) || 
          (typeof description === 'string' && description.toLowerCase().includes('reply'))
        ) {
          Icon = MessageSquare;
        } else if (
          (typeof title === 'string' && (
            title.toLowerCase().includes('success') || 
            title.toLowerCase().includes('resolved') ||
            title.toLowerCase().includes('completed')
          ))
        ) {
          Icon = CheckCircle;
        }
        
        return (
          <Toast 
            key={id} 
            {...props}
            className={`${isMobile ? 'max-w-[350px] p-4 shadow-lg' : ''} animate-fade-in`}
            style={isMobile ? {
              borderLeft: variant === "destructive" ? "4px solid #ef4444" : "4px solid #7c3aed"
            } : undefined}
          >
            <div className="flex gap-3">
              <div className="mt-1">
                <Icon className={`h-5 w-5 ${
                  variant === "destructive" ? "text-red-500" : "text-primary"
                } ${isMobile ? "animate-pulse" : ""}`} />
              </div>
              <div className="grid gap-1">
                {title && <ToastTitle className={isMobile ? "text-[15px] font-medium" : ""}>{title}</ToastTitle>}
                {description && (
                  <ToastDescription className={isMobile ? "text-sm" : ""}>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose className={isMobile ? "h-6 w-6 mt-0.5" : ""} />
          </Toast>
        )
      })}
      <ToastViewport className={isMobile ? "p-3 gap-2" : ""} />
    </ToastProvider>
  )
}
