
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { NotFound as NotFoundContent, Illustration } from "@/components/ui/not-found";
import { ArrowLeft, Home, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NotFound = () => {
  const { isAuthenticated, user } = useAuth();
  
  // Determine where to redirect the user based on authentication status and role
  const getRedirectPath = () => {
    if (!isAuthenticated) return "/";
    
    if (user?.role === "admin") return "/admin-panel";
    if (user?.council === "PRESS") return "/press-dashboard";
    return "/chair-dashboard";
  };

  return (
    <div className="relative flex flex-col w-full justify-center min-h-svh bg-background p-6 md:p-10">
      <div className="relative max-w-5xl mx-auto w-full">
        <Illustration className="absolute inset-0 w-full h-[50vh] opacity-[0.04] text-foreground" />
        <NotFoundContent
          title="Page not found"
          description="Sorry, we couldn't find the page you're looking for. It might have been moved or deleted."
        />
        
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild variant="outline" className="flex gap-2 items-center">
            <Link to={-1 as any}>
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Link>
          </Button>
          
          <Button asChild className="flex gap-2 items-center">
            <Link to={getRedirectPath()}>
              <Home className="h-4 w-4" />
              {isAuthenticated ? "Dashboard" : "Home"}
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex gap-2 items-center"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>
        </div>
        
        <div className="mt-12 text-center text-sm text-muted-foreground">
          <p>If you believe this is an error, please contact the technical team at <br /> 
            <a href="mailto:isbmunconference@gmail.com" className="text-primary underline hover:no-underline">isbmunconference@gmail.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
