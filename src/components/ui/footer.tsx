
interface FooterProps {
  logo?: React.ReactNode;
  brandName: string;
  // The rest are unused for this simplified version
}

export function Footer({
  brandName,
}: FooterProps) {
  return (
    <footer className="w-full flex flex-col items-center justify-center px-4 py-8 bg-white dark:bg-background border-t border-border">
      <div className="flex flex-col items-center space-y-2 w-full">
        <span className="font-bold text-2xl text-primary">{brandName}</span>
        <div className="flex flex-col items-center space-y-1">
          <span className="text-sm text-muted-foreground">© 2025 ISBMUN</span>
          <span className="text-sm text-muted-foreground">Powered by GGE | JT</span>
        </div>
      </div>
    </footer>
  );
}
