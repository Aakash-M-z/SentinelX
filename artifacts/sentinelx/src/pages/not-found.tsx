import { Card, CardContent } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-transparent p-6 font-mono">
      <Card className="w-full max-w-md mx-4 glass-panel border-primary/20 bg-card/65 backdrop-blur-md">
        <CardContent className="pt-6 text-center space-y-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <ShieldAlert className="h-16 w-16 text-primary animate-pulse" />
            <h1 className="text-xl font-bold tracking-widest text-glow text-primary uppercase">Access Denied // 404</h1>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed uppercase tracking-wider">
            The requested tactical coordinates or interface panel could not be localized on the network grid.
          </p>
          
          <div className="pt-4 border-t border-slate-900">
            <Link href="/" className="inline-block px-4 py-2 text-xs bg-primary/20 border border-primary/50 text-primary rounded-lg hover:bg-primary/30 transition-all uppercase tracking-wider font-bold">
              Return to Command Center
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

