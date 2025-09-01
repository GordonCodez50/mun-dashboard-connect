
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { NotFound as NotFoundContent, Illustration } from "@/components/ui/not-found";
import { Button } from '@/components/ui/button';

const NotFound = () => {
  return (
    <div className="relative flex flex-col w-full justify-center min-h-svh bg-background p-6 md:p-10">
      <div className="relative max-w-5xl mx-auto w-full animate-fade-in">
        <Illustration className="absolute inset-0 w-full h-[50vh] opacity-[0.04] text-foreground" />
        <NotFoundContent
          title="Page not found"
          description="Lost, this page is. In another system, it may be."
        />
        
        <div className="mt-8 flex justify-center">
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2 transition-all">
              <ArrowLeft size={16} />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
