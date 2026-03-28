import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <span className="font-bold text-lg">CertifyGRC</span>
          </div>
          <Link to="/">
            <Button>Home</Button>
          </Link>
        </div>
      </nav>

      {/* 404 Content */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-6">
        <div className="max-w-md text-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-6xl font-bold text-primary">404</h1>
            <h2 className="text-2xl font-semibold">Page Not Found</h2>
          </div>

          <p className="text-muted-foreground">
            The page you're looking for doesn't exist or has been moved. 
            Return to the home page or navigate using the menu.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Link to="/" className="flex-1">
              <Button variant="outline" className="w-full gap-2">
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </Link>
            <Link to="/dashboard" className="flex-1">
              <Button className="w-full gap-2">
                Dashboard <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
