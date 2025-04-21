
import React from "react";

interface FooterProps {
  logo: React.ReactNode;
  brandName: string;
  copyright: {
    text: string;
    license?: string;
  };
  // props kept for compatibility, but not used
  socialLinks?: Array<any>;
  mainLinks?: Array<any>;
  legalLinks?: Array<any>;
}

export function Footer({
  logo,
  brandName,
  copyright,
}: FooterProps) {
  return (
    <footer className="w-full py-6 md:py-8 bg-background border-t border-border">
      <div className="mx-auto px-4 w-full max-w-3xl flex flex-col items-center justify-center">
        <div className="flex items-center justify-center gap-3">
          <span className="mr-2 flex-shrink-0">{logo}</span>
          <span className="font-bold text-lg sm:text-xl text-center">{brandName}</span>
        </div>
        <div className="pt-3 flex flex-col items-center justify-center text-sm text-muted-foreground">
          <span className="block">{copyright.text}</span>
          {copyright.license && <span className="block">{copyright.license}</span>}
        </div>
      </div>
    </footer>
  );
}
