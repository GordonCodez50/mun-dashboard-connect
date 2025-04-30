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
      <GradientText className="text-3xl sm:text-5xl md:text-6xl font-bold">
        Loading{dots}
      </GradientText>
    </div>
  );
}
