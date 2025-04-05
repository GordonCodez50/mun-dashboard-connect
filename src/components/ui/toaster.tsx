
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

export function Toaster() {
  const { toasts } = useToast()

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
          <Toast key={id} {...props}>
            <div className="flex gap-3">
              <div className="mt-1">
                <Icon className={`h-5 w-5 ${
                  variant === "destructive" ? "text-red-500" : "text-primary"
                }`} />
              </div>
              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
