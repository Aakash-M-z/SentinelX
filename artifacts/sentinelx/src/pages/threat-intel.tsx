import { useListThreats, useListThreatActors, useGetMitreCoverage, useListIocs } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShieldAlert, Crosshair, Grid, Fingerprint } from "lucide-react";

export default function ThreatIntel() {
  const { data: threats } = useListThreats();
  const { data: actors } = useListThreatActors();
  const { data: mitre } = useGetMitreCoverage();
  const { data: iocs } = useListIocs();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Threat Intelligence</h1>

      <Tabs defaultValue="cve" className="w-full">
        <TabsList className="grid w-full grid-cols-4 glass-panel bg-transparent">
          <TabsTrigger value="cve" className="data-[state=active]:bg-primary/20"><ShieldAlert className="mr-2 h-4 w-4"/> CVE Database</TabsTrigger>
          <TabsTrigger value="actors" className="data-[state=active]:bg-primary/20"><Crosshair className="mr-2 h-4 w-4"/> Threat Actors</TabsTrigger>
          <TabsTrigger value="mitre" className="data-[state=active]:bg-primary/20"><Grid className="mr-2 h-4 w-4"/> MITRE ATT&CK</TabsTrigger>
          <TabsTrigger value="iocs" className="data-[state=active]:bg-primary/20"><Fingerprint className="mr-2 h-4 w-4"/> IOCs</TabsTrigger>
        </TabsList>
        
        <div className="mt-6">
          <TabsContent value="cve">
            <Card className="glass-panel">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>CVE-ID</TableHead>
                      <TableHead>Title</TableHead>
                      <TableHead>Severity</TableHead>
                      <TableHead>CVSS</TableHead>
                      <TableHead>Exploitability</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {threats?.map(t => (
                      <TableRow key={t.id} className="border-border">
                        <TableCell className="font-mono text-primary">{t.cveId}</TableCell>
                        <TableCell>{t.title}</TableCell>
                        <TableCell><Badge variant={t.severity === 'critical' ? 'destructive' : 'secondary'}>{t.severity}</Badge></TableCell>
                        <TableCell>{t.cvssScore}</TableCell>
                        <TableCell><Badge variant="outline">{t.exploitability}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="actors">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {actors?.map(actor => (
                <Card key={actor.id} className="glass-panel">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span className="text-xl">{actor.name}</span>
                      <Badge variant="destructive">{actor.sophistication}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 text-sm">
                    <p className="text-muted-foreground">{actor.description}</p>
                    <div>
                      <span className="font-semibold block mb-1">Motivation:</span>
                      <span className="capitalize">{actor.motivation}</span>
                    </div>
                    <div>
                      <span className="font-semibold block mb-1">Common Tactics:</span>
                      <div className="flex flex-wrap gap-1">
                        {actor.tactics.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="mitre">
             <Card className="glass-panel">
                <CardHeader>
                  <CardTitle>MITRE ATT&CK Coverage ({mitre?.coveragePercent.toFixed(1)}%)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                    {mitre?.tactics.map(tactic => (
                      <div key={tactic.id} className="border border-border/50 rounded bg-card/30 p-2">
                        <div className="text-xs font-bold uppercase border-b border-border/50 pb-2 mb-2 break-words">
                          {tactic.name}
                        </div>
                        <div className="space-y-1">
                          {mitre.techniques.filter(t => t.tactic === tactic.id).map(tech => (
                            <div key={tech.id} className={`text-[10px] p-1 rounded ${tech.detected ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                              {tech.name}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
             </Card>
          </TabsContent>

          <TabsContent value="iocs">
             <Card className="glass-panel">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Type</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Confidence</TableHead>
                      <TableHead>Associated Actor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {iocs?.map(ioc => (
                      <TableRow key={ioc.id} className="border-border">
                        <TableCell><Badge variant="outline" className="uppercase">{ioc.type}</Badge></TableCell>
                        <TableCell className="font-mono">{ioc.value}</TableCell>
                        <TableCell>{(ioc.confidence * 100).toFixed(0)}%</TableCell>
                        <TableCell>{ioc.associatedActor || 'Unknown'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
