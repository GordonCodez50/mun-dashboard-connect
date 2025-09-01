
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Bell, AlertTriangle, MessageSquare, CheckCircle, X, Info } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()
  
  // Deduplicate toasts based on title and description (prevents double notifications)
  const uniqueToasts = toasts.reduce((acc, toast) => {
    const key = `${toast.title || ''}-${toast.description || ''}`;
    if (!acc.some(t => `${t.title || ''}-${t.description || ''}` === key)) {
      acc.push(toast);
    }
    return acc;
  }, [] as typeof toasts);

  return (
    <ToastProvider>
      {uniqueToasts.map(function ({ id, title, description, action, variant, ...props }) {
        // Default values to prevent undefined showing up
        const safeTitle = title || 'Notification';
        const safeDescription = description || '';
        
        // Determine icon based on title, description or variant
        let Icon = Bell;
        
        if (variant === "destructive") {
          Icon = AlertTriangle;
        } else if (
          (typeof safeTitle === 'string' && safeTitle.toLowerCase().includes('reply')) || 
          (typeof safeDescription === 'string' && safeDescription.toLowerCase().includes('reply'))
        ) {
          Icon = MessageSquare;
        } else if (
          (typeof safeTitle === 'string' && (
            safeTitle.toLowerCase().includes('success') || 
            safeTitle.toLowerCase().includes('resolved') ||
            safeTitle.toLowerCase().includes('completed')
          ))
        ) {
          Icon = CheckCircle;
        } else if (
          (typeof safeTitle === 'string' && (
            safeTitle.toLowerCase().includes('info') ||
            safeTitle.toLowerCase().includes('requesting') ||
            safeTitle.toLowerCase().includes('testing')
          ))
        ) {
          Icon = Info;
        }
        
        return (
          <Toast key={id} {...props}>
            <div className="flex gap-3 w-full items-center">
              <div className="mt-1">
                <Icon className={`h-5 w-5 ${
                  variant === "destructive" ? "text-red-500" : 
                  variant === "default" ? "text-primary" :
                  "text-primary"
                }`} />
              </div>
              <div className="grid gap-1 flex-grow">
                {safeTitle && <ToastTitle>{safeTitle}</ToastTitle>}
                {safeDescription && (
                  <ToastDescription>{safeDescription}</ToastDescription>
                )}
              </div>
              <ToastClose />
            </div>
            {action}
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
