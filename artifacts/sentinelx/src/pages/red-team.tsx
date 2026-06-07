import { useGetRedTeamStatus, useListAttacks, useListRedTeamFindings, useExecuteRedTeamStep, getGetRedTeamStatusQueryKey, getListAttacksQueryKey, getListRedTeamFindingsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Play, Terminal, ShieldAlert, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RedTeam() {
  const queryClient = useQueryClient();
  const { data: status, isLoading: statusLoading } = useGetRedTeamStatus({ query: { refetchInterval: 3000 } });
  const { data: attacks, isLoading: attacksLoading } = useListAttacks({ query: { refetchInterval: 3000 } });
  const { data: findings, isLoading: findingsLoading } = useListRedTeamFindings({ query: { refetchInterval: 3000 } });
  const executeStep = useExecuteRedTeamStep();

  const handleNextStep = () => {
    executeStep.mutate({ data: {} }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetRedTeamStatusQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListAttacksQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListRedTeamFindingsQueryKey() });
      }
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">AI Red Team</h1>
        <Button onClick={handleNextStep} disabled={executeStep.isPending} data-testid="btn-run-red-team" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
          <Play className="mr-2 h-4 w-4" /> Run Next Step
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-panel border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="mr-2 h-5 w-5 text-destructive" />
              Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="animate-pulse h-20 bg-muted rounded"></div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">State:</span>
                  <Badge variant={status?.state === 'executing' ? 'destructive' : 'outline'}>{status?.state}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground block mb-1">Current Objective:</span>
                  <div className="font-mono text-sm bg-background p-2 rounded border border-border">
                    {status?.currentObjective || 'None'}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Terminal className="mr-2 h-5 w-5 text-primary" />
              Reasoning Chain
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="font-mono text-xs bg-black text-green-400 p-4 rounded-md h-48 overflow-y-auto whitespace-pre-wrap">
              {status?.reasoning || 'Awaiting reasoning...'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Attack Timeline</CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] overflow-y-auto">
            <div className="space-y-3">
              {attacks?.map((attack, i) => (
                <motion.div
                  key={attack.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 bg-secondary/50 rounded-lg border border-border flex justify-between items-center"
                >
                  <div>
                    <div className="font-mono text-sm font-semibold">{attack.technique}</div>
                    <div className="text-xs text-muted-foreground mt-1">Target: {attack.target} • {attack.mitreId}</div>
                  </div>
                  <Badge variant={attack.status === 'success' ? 'destructive' : 'outline'}>
                    {attack.status}
                  </Badge>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldAlert className="mr-2 h-5 w-5 text-warning" />
              Discovered Findings
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[400px] overflow-y-auto">
            <div className="space-y-3">
              {findings?.map((finding, i) => (
                <motion.div
                  key={finding.id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 bg-secondary/50 rounded-lg border border-border"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium text-sm">{finding.title}</div>
                    <Badge variant={finding.severity === 'critical' ? 'destructive' : 'secondary'}>
                      {finding.severity}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">Asset: {finding.asset} • Type: {finding.type}</div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
