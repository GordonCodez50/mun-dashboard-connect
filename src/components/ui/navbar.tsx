
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/logo.png" alt="ISBMUN" className="h-8 w-auto" />
              <span className="text-xl font-bold">ISBMUN</span>
            </Link>
          </div>
          <div>
            <Button asChild variant="default">
              <Link to="/login">Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
