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

const displayedToasts = new Set<string>();

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const toastKey = `${id}-${title}-${description}`;
        
        if (displayedToasts.has(toastKey)) {
          return null;
        }
        
        displayedToasts.add(toastKey);
        
        setTimeout(() => {
          displayedToasts.delete(toastKey);
        }, props.duration || 5000);
        
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
        } else if (
          (typeof title === 'string' && (
            title.toLowerCase().includes('info') ||
            title.toLowerCase().includes('requesting') ||
            title.toLowerCase().includes('testing')
          ))
        ) {
          Icon = Info;
        }
        
        return (
          <Toast key={id} {...props}>
            <div className="flex gap-3">
              <div className="mt-1">
                <Icon className={`h-5 w-5 ${
                  variant === "destructive" ? "text-red-500" : 
                  variant === "default" ? "text-primary" :
                  "text-primary"
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
