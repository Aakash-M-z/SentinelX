import { useGetBlueTeamStatus, useListAlerts, useAcknowledgeAlert, useExecuteBlueTeamStep, useListDetections, useListFirewallRules, getGetBlueTeamStatusQueryKey, getListAlertsQueryKey, getListDetectionsQueryKey, getListFirewallRulesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, ShieldAlert, ShieldCheck, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function BlueTeam() {
  const queryClient = useQueryClient();
  const { data: status } = useGetBlueTeamStatus({ query: { refetchInterval: 3000 } });
  const { data: alerts } = useListAlerts({ query: { refetchInterval: 3000 } });
  const { data: detections } = useListDetections({ query: { refetchInterval: 3000 } });
  const { data: rules } = useListFirewallRules({ query: { refetchInterval: 3000 } });

  const executeStep = useExecuteBlueTeamStep();
  const ackAlert = useAcknowledgeAlert();

  const handleNextStep = () => {
    executeStep.mutate({ data: {} }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetBlueTeamStatusQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListDetectionsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListFirewallRulesQueryKey() });
      }
    });
  };

  const handleAck = (id: number) => {
    ackAlert.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListAlertsQueryKey() })
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">AI Blue Team</h1>
        <Button onClick={handleNextStep} disabled={executeStep.isPending} data-testid="btn-run-blue-team">
          <Shield className="mr-2 h-4 w-4" /> Run Response Step
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="glass-panel col-span-1 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldCheck className="mr-2 h-5 w-5 text-primary" />
              Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">State:</span>
                <Badge variant={status?.state === 'executing' ? 'default' : 'outline'}>{status?.state}</Badge>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Current Objective:</span>
                <div className="text-sm bg-background p-2 rounded border border-border">
                  {status?.currentObjective || 'Monitoring...'}
                </div>
              </div>
              <div>
                 <span className="text-muted-foreground block mb-1">Reasoning:</span>
                 <div className="font-mono text-xs bg-secondary p-2 rounded h-24 overflow-y-auto">
                   {status?.reasoning}
                 </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShieldAlert className="mr-2 h-5 w-5 text-warning" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[250px] overflow-y-auto">
            <div className="space-y-2">
              {alerts?.map((alert, i) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'high' ? 'destructive' : 'secondary'}>
                      {alert.severity}
                    </Badge>
                    <div>
                      <div className="font-medium text-sm">{alert.title}</div>
                      <div className="text-xs text-muted-foreground">Source: {alert.source} • {alert.mitreId}</div>
                    </div>
                  </div>
                  {alert.status === 'open' && (
                    <Button size="sm" variant="outline" onClick={() => handleAck(alert.id)}>Ack</Button>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Threat Detections
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] overflow-y-auto">
            <div className="space-y-3">
              {detections?.map(det => (
                <div key={det.id} className="p-3 border border-border rounded-lg bg-card/50">
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-medium text-sm">{det.name}</div>
                    <Badge variant="outline">{det.status}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-2">
                    <span className="font-mono text-primary">{det.mitreId}</span>
                    <span>Confidence: {(det.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>AI Firewall Rules</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] overflow-y-auto">
            <div className="space-y-3">
              {rules?.map(rule => (
                <div key={rule.id} className="p-3 border border-border rounded-lg bg-card/50 font-mono text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <Badge variant={rule.action === 'deny' ? 'destructive' : 'secondary'}>{rule.action}</Badge>
                    <span className="text-xs text-muted-foreground">{rule.protocol}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">Src:</span> {rule.source}</div>
                    <div><span className="text-muted-foreground">Dst:</span> {rule.destination}:{rule.port || '*'}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
