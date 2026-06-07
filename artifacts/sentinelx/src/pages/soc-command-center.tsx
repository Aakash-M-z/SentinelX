import { useGetSimulationStatus, useStartSimulation, useStopSimulation, useResetSimulation, useGetSocSummary, useGetActivityFeed, useGetThreatHeatmap, useListSimulationEvents, useGetSimulationMetrics, getGetSimulationStatusQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, RotateCcw, ShieldAlert, Activity, Crosshair } from "lucide-react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

export default function SocCommandCenter() {
  const queryClient = useQueryClient();
  const { data: simulationStatus } = useGetSimulationStatus({ query: { refetchInterval: 3000 } });
  const { data: socSummary } = useGetSocSummary();
  const { data: metrics } = useGetSimulationMetrics();
  const { data: events } = useListSimulationEvents();

  const startSim = useStartSimulation();
  const stopSim = useStopSimulation();
  const resetSim = useResetSimulation();

  const isRunning = simulationStatus?.state === "running";

  const handleStart = () => startSim.mutate({ data: { scenario: "apt_attack", difficulty: "medium" } }, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSimulationStatusQueryKey() }) });
  const handleStop = () => stopSim.mutate(undefined, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSimulationStatusQueryKey() }) });
  const handleReset = () => resetSim.mutate(undefined, { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSimulationStatusQueryKey() }) });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">SOC Command Center</h1>
        <div className="flex gap-2">
          {!isRunning ? (
            <Button onClick={handleStart} className="bg-primary text-primary-foreground hover:bg-primary/90" data-testid="btn-start-sim">
              <Play className="mr-2 h-4 w-4" /> Start Simulation
            </Button>
          ) : (
            <Button onClick={handleStop} variant="destructive" data-testid="btn-stop-sim">
              <Square className="mr-2 h-4 w-4" /> Stop Simulation
            </Button>
          )}
          <Button onClick={handleReset} variant="outline" data-testid="btn-reset-sim">
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Incidents</CardTitle>
            <ShieldAlert className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{socSummary?.activeIncidents || 0}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Risk Score</CardTitle>
            <Activity className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{socSummary?.riskScore || 0}/100</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">Detection Rate</CardTitle>
            <Crosshair className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{socSummary?.detectionRate ? `${socSummary.detectionRate}%` : '0%'}</div>
          </CardContent>
        </Card>
        <Card className="glass-panel">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-muted-foreground">MTTD</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{socSummary?.mttd ? `${socSummary.mttd}m` : '0m'}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-panel h-[400px] flex flex-col">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <div className="space-y-4">
              {events?.slice(0, 10).map((event, i) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-4 p-3 rounded-lg bg-card/50 border border-border"
                >
                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{event.description}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {event.actor} • {event.type}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
