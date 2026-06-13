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
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Terminal } from "lucide-react";

const queryClient = new QueryClient();

function BootLoader({ onComplete }: { onComplete: () => void }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);

  const bootStages = [
    "SENTINELX INITIALIZING...",
    "Loading Threat Engine...",
    "Connecting Security Nodes...",
    "Loading MITRE Framework...",
    "AI Copilot Online...",
    "Threat Intelligence Synced...",
  ];

  useEffect(() => {
    let currentStage = 0;
    
    // Add logs step-by-step
    const logInterval = setInterval(() => {
      if (currentStage < bootStages.length) {
        setLogs(prev => [...prev, bootStages[currentStage]]);
        currentStage++;
      } else {
        clearInterval(logInterval);
      }
    }, 450);

    // Increment progress bar smoothly
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setTimeout(onComplete, 400); // completed, fade out
          return 100;
        }
        return prev + 2;
      });
    }, 55);

    return () => {
      clearInterval(logInterval);
      clearInterval(progressInterval);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-[#0A0A0C] flex flex-col items-center justify-center z-[9999] p-6 overflow-hidden">
      {/* Cyber Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,23,68,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,23,68,0.02)_1px,transparent_1px)] bg-[size:30px_30px]" />
      
      <div className="relative w-full max-w-lg bg-[#0F0F14]/95 border border-slate-800 rounded-lg p-6 shadow-[0_0_50px_rgba(255,23,68,0.08)] backdrop-blur-md">
        {/* Neon Glow Accents */}
        <div className="absolute -top-px -left-px w-20 h-[2px] bg-primary" />
        <div className="absolute -top-px -left-px w-[2px] h-20 bg-primary" />
        
        {/* Terminal Header */}
        <div className="flex items-center gap-2 mb-6 border-b border-slate-800/80 pb-3">
          <Terminal className="w-5 h-5 text-primary animate-pulse" />
          <span className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">Core Boot Sequence</span>
          <div className="ml-auto flex gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-700"></span>
            <span className="w-2 h-2 rounded-full bg-slate-700"></span>
            <span className="w-2 h-2 rounded-full bg-primary/80 animate-ping"></span>
          </div>
        </div>

        {/* Logo and Loader */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center border border-primary/25">
            <Shield className="w-6 h-6 text-primary animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-mono tracking-wider text-glow">SENTINELX</h1>
            <p className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Tactical Cyber Defense Ops</p>
          </div>
        </div>

        {/* Log Box */}
        <div className="h-36 font-mono text-xs text-slate-300 space-y-1.5 overflow-y-auto mb-6 border border-slate-800 bg-[#060608] p-3 rounded">
          {logs.map((log, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.15 }}
              className={i === 0 ? "text-primary font-bold text-glow" : "text-slate-300"}
            >
              <span className="text-primary mr-1.5">&gt;</span> {log}
            </motion.div>
          ))}
          {progress < 100 && (
            <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse align-middle" />
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between font-mono text-[10px] text-slate-400">
            <span className="uppercase tracking-widest">Systems Diagnostics</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
            <motion.div
              className="h-full bg-primary"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

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
  const [booting, setBooting] = useState(true);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AnimatePresence mode="wait">
          {booting ? (
            <BootLoader key="boot-loader" onComplete={() => setBooting(false)} />
          ) : (
            <motion.div
              key="main-app"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="h-screen w-screen overflow-hidden bg-background"
            >
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <Toaster />
            </motion.div>
          )}
        </AnimatePresence>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
