import { useEffect, useState } from "react";
import { GradientText } from "./gradient-text";

export function LoadingScreen() {
  const [dots, setDots] = useState(".");

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length === 3 ? "." : prev + "."));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center transition-opacity duration-500">
      <div className="flex items-center space-x-1">
        <GradientText className="text-2xl sm:text-4xl md:text-5xl font-bold">
          Loading
        </GradientText>
        <span className="text-xl sm:text-2xl md:text-3xl text-muted-foreground font-semibold mt-1">
          {dots}
        </span>
      </div>
    </div>
  );
}
