import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { MainLayout } from "@/components/layout/main-layout";
import SocCommandCenter from "@/pages/soc-command-center";
import RedTeam from "@/pages/red-team";
import AttackGraph from "@/pages/attack-graph";
import BlueTeam from "@/pages/blue-team";
import Commander from "@/pages/commander";
import CyberRange from "@/pages/cyber-range";
import ThreatIntel from "@/pages/threat-intel";
import Incidents from "@/pages/incidents";
import Copilot from "@/pages/copilot";

const queryClient = new QueryClient();

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={SocCommandCenter} />
        <Route path="/red-team" component={RedTeam} />
        <Route path="/attack-graph" component={AttackGraph} />
        <Route path="/blue-team" component={BlueTeam} />
        <Route path="/commander" component={Commander} />
        <Route path="/cyber-range" component={CyberRange} />
        <Route path="/threat-intel" component={ThreatIntel} />
        <Route path="/incidents" component={Incidents} />
        <Route path="/copilot" component={Copilot} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
