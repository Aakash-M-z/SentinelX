import { useGetCommanderReport, useGetRiskScore, useRunCommanderAnalysis, getGetCommanderReportQueryKey, getGetRiskScoreQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { BrainCircuit, ShieldCheck, DollarSign, Activity } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function Commander() {
  const queryClient = useQueryClient();
  const { data: report, isLoading: reportLoading } = useGetCommanderReport();
  const { data: riskScore, isLoading: riskLoading } = useGetRiskScore();
  const runAnalysis = useRunCommanderAnalysis();

  const handleAnalyze = () => {
    runAnalysis.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCommanderReportQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetRiskScoreQueryKey() });
      }
    });
  };

  const radarData = riskScore ? [
    { subject: 'Network', A: riskScore.categories.network },
    { subject: 'Endpoint', A: riskScore.categories.endpoint },
    { subject: 'App', A: riskScore.categories.application },
    { subject: 'Data', A: riskScore.categories.data },
    { subject: 'Identity', A: riskScore.categories.identity },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Security Commander</h1>
        <Button onClick={handleAnalyze} disabled={runAnalysis.isPending} data-testid="btn-run-commander">
          <BrainCircuit className="mr-2 h-4 w-4" /> Run Strategic Analysis
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-panel col-span-2">
          <CardHeader>
            <CardTitle>Executive Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {reportLoading ? (
               <div className="h-32 bg-muted animate-pulse rounded" />
            ) : (
              <>
                <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Business Impact</h3>
                  <p className="text-sm leading-relaxed">{report?.executiveSummary}</p>
                </div>
                <div className="pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-1">Technical TL;DR</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{report?.technicalSummary}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="glass-panel">
          <CardHeader>
            <CardTitle>Overall Risk Score</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center h-[200px]">
            {riskLoading ? (
              <div className="h-24 w-24 bg-muted animate-pulse rounded-full" />
            ) : (
              <>
                <div className="text-6xl font-bold text-primary mb-2">{riskScore?.overall}</div>
                <Badge variant={riskScore?.trend === 'improving' ? 'default' : 'destructive'}>
                  Trend: {riskScore?.trend}
                </Badge>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-panel col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="mr-2 h-5 w-5 text-primary" />
              Risk Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar name="Risk" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-panel col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <DollarSign className="mr-2 h-5 w-5 text-warning" />
              Impact & Compliance
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="grid grid-cols-2 gap-6">
               <div>
                 <h3 className="text-sm font-semibold text-muted-foreground mb-3">Estimated Financial Impact</h3>
                 <div className="text-3xl font-mono text-destructive">{report?.financialImpact || '$0'}</div>
                 
                 <h3 className="text-sm font-semibold text-muted-foreground mt-6 mb-3">Recommended Mitigations</h3>
                 <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 pl-4">
                   {report?.mitigations.map((m, i) => <li key={i}>{m}</li>)}
                 </ul>
               </div>
               
               <div>
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Compliance Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-secondary rounded border border-border">
                      <span className="font-semibold">NIST CSF</span>
                      <Badge variant="outline">{report?.compliance.nist || 'N/A'}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-secondary rounded border border-border">
                      <span className="font-semibold">ISO 27001</span>
                      <Badge variant="outline">{report?.compliance.iso27001 || 'N/A'}</Badge>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-secondary rounded border border-border">
                      <span className="font-semibold">SOC 2 Type II</span>
                      <Badge variant="outline">{report?.compliance.soc2 || 'N/A'}</Badge>
                    </div>
                  </div>
               </div>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
