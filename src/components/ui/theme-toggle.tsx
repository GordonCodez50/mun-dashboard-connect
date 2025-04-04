
import React from "react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { Moon, Sun } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            className="rounded-full w-8 h-8"
          >
            {theme === "dark" ? (
              <Sun size={18} className="text-gray-200" />
            ) : (
              <Moon size={18} className="text-gray-700" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>{theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
