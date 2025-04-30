import { MoveRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

function CTA() {
  return (
    <div className="w-full py-20 lg:py-40">
      <div className="container mx-auto">
        <div className="flex flex-col text-center bg-muted rounded-md p-4 lg:p-14 gap-8 items-center">
          <div>
            <Badge>Get started</Badge>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-3xl md:text-5xl tracking-tighter max-w-xl font-regular">
              Access Your Dashboard!
            </h3>
            <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-xl">
              Experience ISBMUN 2025’s next-generation management platform—purpose-built for Bahrain’s leading MUN conference. From real-time council management to instant alerts and seamless document sharing, every feature is tailored to streamline your MUN experience and keep the focus on diplomacy, debate, and leadership.
            </p>
          </div>
          <div className="flex flex-row gap-4">
            <Button asChild className="gap-4">
              <Link to="/login">
                Login Now <MoveRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export { CTA };
