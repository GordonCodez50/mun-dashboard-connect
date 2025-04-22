
import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { Bell, AlertTriangle, MessageSquare, CheckCircle, X, Info, RefreshCw, HelpCircle, Bolt } from "lucide-react"

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
        
        // Enhanced icon detection with more detailed patterns
        if (variant === "destructive") {
          Icon = AlertTriangle;
        } else if (
          typeof safeTitle === 'string' && (
            safeTitle.toLowerCase().includes('error') ||
            safeTitle.toLowerCase().includes('failed') ||
            safeTitle.toLowerCase().includes('unable')
          )
        ) {
          Icon = X;
        } else if (
          (typeof safeTitle === 'string' && (
            safeTitle.toLowerCase().includes('reply') ||
            safeTitle.toLowerCase().includes('message') ||
            safeTitle.toLowerCase().includes('notification')
          )) || 
          (typeof safeDescription === 'string' && (
            safeDescription.toLowerCase().includes('reply') ||
            safeDescription.toLowerCase().includes('message')
          ))
        ) {
          Icon = MessageSquare;
        } else if (
          (typeof safeTitle === 'string' && (
            safeTitle.toLowerCase().includes('success') || 
            safeTitle.toLowerCase().includes('resolved') ||
            safeTitle.toLowerCase().includes('completed') ||
            safeTitle.toLowerCase().includes('saved') ||
            safeTitle.toLowerCase().includes('updated')
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
        } else if (
          (typeof safeTitle === 'string' && (
            safeTitle.toLowerCase().includes('reload') ||
            safeTitle.toLowerCase().includes('refresh') ||
            safeTitle.toLowerCase().includes('retry')
          ))
        ) {
          Icon = RefreshCw;
        } else if (
          (typeof safeTitle === 'string' && (
            safeTitle.toLowerCase().includes('tip') ||
            safeTitle.toLowerCase().includes('hint') ||
            safeTitle.toLowerCase().includes('help')
          ))
        ) {
          Icon = HelpCircle;
        } else if (
          (typeof safeTitle === 'string' && (
            safeTitle.toLowerCase().includes('urgent') ||
            safeTitle.toLowerCase().includes('attention') ||
            safeTitle.toLowerCase().includes('alert') ||
            safeTitle.toLowerCase().includes('important')
          ))
        ) {
          Icon = Bolt;
        }
        
        // Add animation based on variant
        const animationClass = variant === "destructive" 
          ? "animate-bounce-subtle" 
          : variant === "default" && (safeTitle.toLowerCase().includes('success') || safeTitle.toLowerCase().includes('saved'))
            ? "animate-fade-in" 
            : "";
        
        return (
          <Toast key={id} {...props} className={`${props.className || ''} ${animationClass}`}>
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
