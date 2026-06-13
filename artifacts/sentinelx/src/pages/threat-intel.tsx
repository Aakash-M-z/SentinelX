import { useState } from "react";
import { 
  useListThreats, 
  useListThreatActors, 
  useGetMitreCoverage, 
  useListIocs 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ShieldAlert, 
  Crosshair, 
  Grid, 
  Fingerprint, 
  Calendar, 
  Search, 
  TrendingUp, 
  AlertCircle, 
  ArrowRight, 
  Compass, 
  Cpu, 
  Users, 
  Flame, 
  Activity 
} from "lucide-react";
import { motion } from "framer-motion";

export default function ThreatIntel() {
  const { data: threats } = useListThreats();
  const { data: actors } = useListThreatActors();
  const { data: mitre } = useGetMitreCoverage();
  const { data: iocs } = useListIocs();

  // Selected details states
  const [selectedCveId, setSelectedCveId] = useState<string | null>(null);
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [iocSearch, setIocSearch] = useState("");

  // CVE Calculations
  const sortedThreatsByCvss = [...(threats ?? [])].sort((a, b) => b.cvssScore - a.cvssScore);
  const activeCve = threats?.find(t => t.cveId === selectedCveId) || sortedThreatsByCvss[0];

  // Active Actor selection
  const activeActor = actors?.find(a => String(a.id) === String(selectedActorId)) || actors?.[0];

  // Filtered IOCs
  const filteredIocs = (iocs ?? []).filter(ioc => {
    const q = iocSearch.toLowerCase();
    return (
      ioc.type.toLowerCase().includes(q) ||
      ioc.value.toLowerCase().includes(q) ||
      (ioc.associatedActor && ioc.associatedActor.toLowerCase().includes(q))
    );
  });

  // SVG CVE Chart coordinates setup
  const chartWidth = 750;
  const chartHeight = 220;
  const paddingX = 45;
  const paddingY = 25;
  const plotWidth = chartWidth - paddingX - 25;
  const plotHeight = chartHeight - paddingY - 30;

  return (
    <div className="p-6 space-y-6 bg-transparent">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-wider text-glow uppercase">Threat Intelligence Hub</h1>
          <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest">Global CVE Matrix & Actor Profiles</p>
        </div>
        
        {/* Core Stats Bar */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="bg-[#0F0F14] border border-border px-3.5 py-1.5 rounded-lg flex items-center gap-2">
            <ShieldAlert size={14} className="text-primary animate-pulse" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">CRITICAL CVES:</span>
            <span className="text-xs font-mono font-bold text-primary">
              {threats?.filter(t => t.severity === "critical").length || 0}
            </span>
          </div>
          <div className="bg-[#0F0F14] border border-border px-3.5 py-1.5 rounded-lg flex items-center gap-2">
            <Users size={14} className="text-amber-500" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">ACTIVE ACTORS:</span>
            <span className="text-xs font-mono font-bold text-amber-500">{actors?.length || 0}</span>
          </div>
          <div className="bg-[#0F0F14] border border-border px-3.5 py-1.5 rounded-lg flex items-center gap-2">
            <Activity size={14} className="text-emerald-500 animate-pulse" />
            <span className="text-[10px] font-mono text-muted-foreground uppercase">MITRE COVERAGE:</span>
            <span className="text-xs font-mono font-bold text-emerald-500">
              {mitre?.coveragePercent ? mitre.coveragePercent.toFixed(1) : "0.0"}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Interactive Tabs */}
      <Tabs defaultValue="cve" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[#0F0F14] border border-border p-1 rounded-xl">
          <TabsTrigger value="cve" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-mono text-xs py-2.5">
            <ShieldAlert className="mr-2 h-4 w-4" /> CVE EXPOSURES
          </TabsTrigger>
          <TabsTrigger value="actors" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-mono text-xs py-2.5">
            <Crosshair className="mr-2 h-4 w-4" /> THREAT DOSSIERS
          </TabsTrigger>
          <TabsTrigger value="mitre" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-mono text-xs py-2.5">
            <Grid className="mr-2 h-4 w-4" /> MITRE COVERAGE
          </TabsTrigger>
          <TabsTrigger value="iocs" className="data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-mono text-xs py-2.5">
            <Fingerprint className="mr-2 h-4 w-4" /> IOC ARCHIVE
          </TabsTrigger>
        </TabsList>
        
        {/* Tab contents */}
        <div className="mt-6">
          
          {/* CVE DATABASE TAB */}
          <TabsContent value="cve" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Panel: SVG Telemetry Chart */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                <Card className="glass-panel border-border/60">
                  <CardHeader className="pb-2">
                    <CardTitle className="font-mono text-sm uppercase tracking-wider text-glow flex items-center gap-2">
                      <TrendingUp size={16} className="text-primary" /> CVE Severity CVSS Distribution Timeline
                    </CardTitle>
                    <CardDescription className="text-xs font-sans text-muted-foreground">
                      Telemetry plot mapping vulnerabilities by CVSS score. Click node markers to load exploitation dossiers.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 overflow-x-auto">
                    {sortedThreatsByCvss.length > 0 ? (
                      <div className="min-w-[750px] relative">
                        <svg width={chartWidth} height={chartHeight} className="mx-auto overflow-visible">
                          {/* Grid Definitions */}
                          <defs>
                            <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgba(255, 23, 68, 0.2)" />
                              <stop offset="100%" stopColor="rgba(255, 23, 68, 0.0)" />
                            </linearGradient>
                            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                              <feGaussianBlur stdDeviation="3" result="blur" />
                              <feComposite in="SourceGraphic" in2="blur" operator="over" />
                            </filter>
                          </defs>

                          {/* Grid Lines (CVSS levels) */}
                          {[2, 4, 6, 8, 10].map((level) => {
                            const y = paddingY + (1 - level / 10) * plotHeight;
                            return (
                              <g key={level}>
                                <line 
                                  x1={paddingX} 
                                  y1={y} 
                                  x2={chartWidth - 25} 
                                  y2={y} 
                                  className="stroke-border/40 stroke-dashed" 
                                  strokeDasharray="4,4" 
                                />
                                <text 
                                  x={paddingX - 10} 
                                  y={y + 4} 
                                  className="fill-muted-foreground font-mono text-[9px] text-right text-anchor-end"
                                >
                                  {level.toFixed(1)}
                                </text>
                              </g>
                            );
                          })}

                          {/* Render Curve Connectors */}
                          {(() => {
                            const points = sortedThreatsByCvss.map((t, idx) => {
                              const x = paddingX + (idx / Math.max(1, sortedThreatsByCvss.length - 1)) * plotWidth;
                              const y = paddingY + (1 - t.cvssScore / 10) * plotHeight;
                              return { x, y };
                            });

                            let pathD = "";
                            let areaD = `M ${paddingX} ${paddingY + plotHeight} `;
                            
                            points.forEach((p, idx) => {
                              if (idx === 0) {
                                pathD += `M ${p.x} ${p.y} `;
                                areaD += `L ${p.x} ${p.y} `;
                              } else {
                                // Draw curved bezier paths
                                const cpX1 = points[idx - 1].x + (p.x - points[idx - 1].x) / 2;
                                const cpY1 = points[idx - 1].y;
                                const cpX2 = points[idx - 1].x + (p.x - points[idx - 1].x) / 2;
                                const cpY2 = p.y;
                                pathD += `C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y} `;
                                areaD += `C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y} `;
                              }
                            });

                            areaD += `L ${points[points.length - 1].x} ${paddingY + plotHeight} Z`;

                            return (
                              <>
                                <path d={areaD} fill="url(#areaGrad)" />
                                <path d={pathD} fill="none" stroke="#FF1744" strokeWidth="2" filter="url(#glow)" />
                              </>
                            );
                          })()}

                          {/* Render Nodes */}
                          {sortedThreatsByCvss.map((t, idx) => {
                            const x = paddingX + (idx / Math.max(1, sortedThreatsByCvss.length - 1)) * plotWidth;
                            const y = paddingY + (1 - t.cvssScore / 10) * plotHeight;
                            const isActive = activeCve?.cveId === t.cveId;
                            
                            return (
                              <g key={t.cveId} className="cursor-pointer" onClick={() => setSelectedCveId(t.cveId)}>
                                <circle 
                                  cx={x} 
                                  cy={y} 
                                  r={isActive ? 8 : 5} 
                                  className={`${isActive ? "fill-primary" : "fill-slate-900 stroke-primary"} transition-all duration-300`} 
                                  strokeWidth="1.5" 
                                />
                                {isActive && (
                                  <circle 
                                    cx={x} 
                                    cy={y} 
                                    r="13" 
                                    className="stroke-primary fill-none animate-ping opacity-60" 
                                    strokeWidth="1" 
                                  />
                                )}
                              </g>
                            );
                          })}

                          {/* X-Axis Labels */}
                          {sortedThreatsByCvss.map((t, idx) => {
                            if (sortedThreatsByCvss.length > 8 && idx % 2 !== 0) return null; // reduce clutter
                            const x = paddingX + (idx / Math.max(1, sortedThreatsByCvss.length - 1)) * plotWidth;
                            return (
                              <text 
                                key={t.cveId} 
                                x={x} 
                                y={chartHeight - 8} 
                                className="fill-muted-foreground font-mono text-[8px] text-anchor-middle"
                                transform={`rotate(15, ${x}, ${chartHeight - 8})`}
                              >
                                {t.cveId}
                              </text>
                            );
                          })}
                        </svg>
                      </div>
                    ) : (
                      <div className="h-48 flex items-center justify-center text-muted-foreground font-mono">
                        No threat intelligence data synced.
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* CVE List Table */}
                <Card className="glass-panel border-border/60">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-border/60 bg-[#0F0F14]/60">
                          <TableHead className="font-mono text-[10px] text-slate-400 uppercase">CVE-ID</TableHead>
                          <TableHead className="font-mono text-[10px] text-slate-400 uppercase">Title</TableHead>
                          <TableHead className="font-mono text-[10px] text-slate-400 uppercase">Severity</TableHead>
                          <TableHead className="font-mono text-[10px] text-slate-400 uppercase">CVSS SCORE</TableHead>
                          <TableHead className="font-mono text-[10px] text-slate-400 uppercase">Exploitability</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {threats?.map(t => (
                          <TableRow 
                            key={t.id} 
                            onClick={() => setSelectedCveId(t.cveId)}
                            className={`border-border/60 cursor-pointer transition-colors ${
                              activeCve?.cveId === t.cveId 
                                ? "bg-primary/5 hover:bg-primary/10" 
                                : "hover:bg-slate-900/40"
                            }`}
                          >
                            <TableCell className="font-mono font-bold text-primary text-xs">{t.cveId}</TableCell>
                            <TableCell className="font-mono text-xs max-w-xs truncate">{t.title}</TableCell>
                            <TableCell>
                              <Badge variant={t.severity === 'critical' ? 'destructive' : 'secondary'} className="uppercase text-[9px] font-bold tracking-wider px-1.5 py-0.5">
                                {t.severity}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs">{t.cvssScore.toFixed(1)}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="border-primary/20 text-primary text-[9px] font-mono capitalize">
                                {t.exploitability}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>

              {/* Right Panel: CVE Intel Dossier */}
              <div className="lg:col-span-4 h-full">
                {activeCve ? (
                  <Card className="glass-panel border-primary/20 h-full flex flex-col justify-between p-5 relative overflow-hidden bg-gradient-to-b from-primary/[0.02] to-transparent">
                    {/* Glowing Accent Corner */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-primary/5 rounded-bl-full border-b border-l border-primary/10 pointer-events-none" />
                    
                    <div className="space-y-6">
                      <div className="flex justify-between items-start border-b border-border pb-3">
                        <div className="space-y-1">
                          <Badge variant="destructive" className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5">
                            {activeCve.severity} EXPOSURE
                          </Badge>
                          <h2 className="text-xl font-bold font-mono tracking-wider text-glow mt-1 text-primary">{activeCve.cveId}</h2>
                        </div>
                        <div className="w-11 h-11 bg-primary/10 border border-primary/30 rounded-lg flex flex-col items-center justify-center">
                          <span className="text-[8px] font-mono text-muted-foreground uppercase leading-none">CVSS</span>
                          <span className="text-sm font-mono font-bold text-primary leading-none mt-1">{activeCve.cvssScore.toFixed(1)}</span>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-1">
                          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest block">Threat Title</span>
                          <p className="text-xs font-mono text-slate-200 leading-relaxed">{activeCve.title}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#0F0F14] border border-border p-2.5 rounded-lg">
                            <span className="text-[9px] font-mono text-muted-foreground uppercase block mb-1">Exploit Status</span>
                            <span className="text-xs font-mono text-primary font-bold capitalize flex items-center gap-1.5">
                              <Flame size={12} className="text-primary animate-pulse" /> {activeCve.exploitability}
                            </span>
                          </div>
                          <div className="bg-[#0F0F14] border border-border p-2.5 rounded-lg">
                            <span className="text-[9px] font-mono text-muted-foreground uppercase block mb-1">Audit Vector</span>
                            <span className="text-xs font-mono text-slate-300 font-bold capitalize flex items-center gap-1.5">
                              <Cpu size={12} className="text-slate-400" /> Remote Code
                            </span>
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-border pt-4">
                          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest block">Remediation Guidelines</span>
                          <div className="space-y-1.5">
                            <div className="flex items-start gap-2 text-[10px] font-mono text-slate-300">
                              <ArrowRight size={10} className="text-primary flex-shrink-0 mt-1" />
                              <span>Apply official security vendor patches immediately.</span>
                            </div>
                            <div className="flex items-start gap-2 text-[10px] font-mono text-slate-300">
                              <ArrowRight size={10} className="text-primary flex-shrink-0 mt-1" />
                              <span>Disable non-essential remote ports and restrict network scopes.</span>
                            </div>
                            <div className="flex items-start gap-2 text-[10px] font-mono text-slate-300">
                              <ArrowRight size={10} className="text-primary flex-shrink-0 mt-1" />
                              <span>Deploy Snort/Yara rule definitions across perimeter firewalls.</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 mt-6">
                      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar size={11} className="text-primary" /> SECURED ARCHIVE
                        </span>
                        <span>CONFIRMED EXPLOIT</span>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="h-full glass-panel border border-border rounded-xl flex items-center justify-center p-6 text-center text-muted-foreground font-mono">
                    Select a vulnerability to load dossier details.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* THREAT ACTORS TAB */}
          <TabsContent value="actors">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Column: Actor Cards Grid (8/12) */}
              <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
                {actors?.map(actor => (
                  <Card 
                    key={actor.id} 
                    onClick={() => setSelectedActorId(String(actor.id))}
                    className={`glass-panel border-border/60 hover:border-primary/40 cursor-pointer p-5 transition-all relative overflow-hidden flex flex-col justify-between ${
                      String(activeActor?.id) === String(actor.id) 
                        ? "border-primary/50 bg-primary/[0.01]" 
                        : ""
                    }`}
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start border-b border-border pb-3">
                        <div>
                          <h3 className="text-base font-bold font-mono tracking-wider text-slate-100">{actor.name}</h3>
                          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest mt-1 block">APT DOSSIER</span>
                        </div>
                        <Badge variant="destructive" className="font-mono text-[9px] px-2 uppercase tracking-wide">
                          {actor.sophistication}
                        </Badge>
                      </div>
                      
                      <p className="text-xs font-mono text-muted-foreground line-clamp-3 leading-relaxed">
                        {actor.description}
                      </p>
                    </div>

                    <div className="border-t border-border/60 pt-3 mt-4 flex justify-between items-center text-[10px] font-mono">
                      <span className="text-muted-foreground uppercase">Motivation:</span>
                      <span className="text-primary uppercase tracking-wide font-bold">{actor.motivation}</span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Right Column: Detailed Dossier File (5/12) */}
              <div className="lg:col-span-5 h-full">
                {activeActor ? (
                  <Card className="glass-panel border-primary/20 p-6 space-y-6 relative overflow-hidden bg-gradient-to-b from-primary/[0.015] to-transparent h-full flex flex-col justify-between">
                    <div className="space-y-6">
                      <div className="flex justify-between items-start border-b border-border pb-4">
                        <div className="space-y-1">
                          <Badge variant="destructive" className="font-mono text-[9px] tracking-widest px-2 uppercase">
                            APT TARGET REPORT
                          </Badge>
                          <h2 className="text-xl font-bold font-mono tracking-wider text-glow mt-1 text-primary">{activeActor.name}</h2>
                        </div>
                        <div className="w-10 h-10 bg-primary/10 border border-primary/30 rounded-lg flex items-center justify-center">
                          <Compass size={20} className="text-primary animate-pulse" />
                        </div>
                      </div>

                      <div className="space-y-4 text-xs font-mono">
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-muted-foreground uppercase tracking-widest block">Tactical Overview</span>
                          <p className="text-slate-300 leading-relaxed font-mono">{activeActor.description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3.5">
                          <div className="bg-[#0F0F14] border border-border p-2.5 rounded-lg">
                            <span className="text-[9px] text-muted-foreground uppercase block mb-1">Motive Focus</span>
                            <span className="text-xs text-primary font-bold uppercase">{activeActor.motivation}</span>
                          </div>
                          <div className="bg-[#0F0F14] border border-border p-2.5 rounded-lg">
                            <span className="text-[9px] text-muted-foreground uppercase block mb-1">Operational Origin</span>
                            <span className="text-xs text-slate-300 font-bold">East Asia / Cyber Core</span>
                          </div>
                        </div>

                        <div className="space-y-2 border-t border-border pt-4">
                          <span className="text-[9px] text-muted-foreground uppercase tracking-widest block">Associated Techniques</span>
                          <div className="flex flex-wrap gap-1.5">
                            {activeActor.tactics.map(t => (
                              <Badge key={t} variant="secondary" className="border border-border/80 text-[9px] font-mono uppercase bg-[#0F0F14] text-slate-300 hover:bg-slate-900 px-2 py-0.5">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-border pt-4 mt-6">
                      <div className="flex items-center justify-between text-[10px] font-mono text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <AlertCircle size={12} className="text-primary" /> ENHANCED TRACKING
                        </span>
                        <span>INTEL SYNC: CONFIRMED</span>
                      </div>
                    </div>
                  </Card>
                ) : (
                  <div className="h-full glass-panel border border-border rounded-xl flex items-center justify-center p-6 text-center text-muted-foreground font-mono">
                    Select a Threat Actor to view active Dossier details.
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          {/* MITRE ATT&CK MATRIX COVERAGE TAB */}
          <TabsContent value="mitre">
            <Card className="glass-panel border-border/60">
              <CardHeader className="pb-4 border-b border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-mono text-sm uppercase tracking-wider text-glow flex items-center gap-2">
                      <Grid size={16} className="text-primary" /> MITRE ATT&CK Matrix Matrix Mapping
                    </CardTitle>
                    <CardDescription className="text-xs font-sans text-muted-foreground mt-0.5">
                      Visualizing attack coverage indicators. Highlighted techniques reflect monitored activity triggers.
                    </CardDescription>
                  </div>
                  
                  {/* Progress gauge */}
                  <div className="flex items-center gap-3 bg-[#0A0A0C] border border-border rounded-xl px-4 py-2 self-start">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">COVERAGE RATIO:</span>
                    <div className="h-2 w-28 bg-slate-900 rounded-full overflow-hidden border border-border">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${mitre?.coveragePercent ?? 0}%` }} 
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-primary">
                      {mitre?.coveragePercent ? mitre.coveragePercent.toFixed(1) : "0.0"}%
                    </span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 overflow-x-auto">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 min-w-[900px]">
                  {(mitre?.tactics ?? []).map(tactic => (
                    <div key={tactic.id} className="border border-border/50 rounded-lg bg-card/25 p-3 flex flex-col gap-3">
                      <div className="text-[10px] font-mono font-bold uppercase border-b border-border/50 pb-2 mb-1 text-slate-300 tracking-wider truncate">
                        {tactic.name}
                      </div>
                      
                      <div className="space-y-1.5 flex-1">
                        {(mitre?.techniques ?? [])
                          .filter(t => t.tactic === tactic.id)
                          .map(tech => (
                            <div 
                              key={tech.id} 
                              className={`text-[9px] font-mono p-2 rounded border transition-all ${
                                tech.detected 
                                  ? "bg-primary/10 text-primary border-primary/30 text-glow shadow-[0_0_10px_rgba(255,23,68,0.08)]" 
                                  : "bg-[#060608]/40 border-border/40 text-muted-foreground opacity-60 hover:opacity-100"
                              }`}
                            >
                              <div className="font-bold flex justify-between items-center gap-1.5">
                                <span className="truncate">{tech.name}</span>
                                {tech.detected && <span className="w-1 h-1 rounded-full bg-primary animate-ping" />}
                              </div>
                              <div className="text-[8px] text-muted-foreground/60 mt-0.5 font-normal">
                                {tech.detected ? "MONITORED" : "INACTIVE"}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* INDICATORS OF COMPROMISE TAB */}
          <TabsContent value="iocs">
            <Card className="glass-panel border-border/60">
              <CardHeader className="pb-3 border-b border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <CardTitle className="font-mono text-sm uppercase tracking-wider text-glow flex items-center gap-2">
                      <Fingerprint size={16} className="text-primary" /> Indicators of Compromise (IOC) Archive
                    </CardTitle>
                    <CardDescription className="text-xs font-sans text-muted-foreground mt-0.5">
                      Registry keys, malicious file hashes, domain listings, and attacker IP exposures.
                    </CardDescription>
                  </div>
                  
                  {/* Search box */}
                  <div className="relative w-full sm:w-64">
                    <input
                      type="text"
                      placeholder="Search IOCs value / actor..."
                      value={iocSearch}
                      onChange={(e) => setIocSearch(e.target.value)}
                      className="w-full bg-[#060608] border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-600 focus:border-primary/60 focus:outline-none"
                    />
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-600 w-3.5 h-3.5" />
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 bg-[#0F0F14]/60">
                      <TableHead className="font-mono text-[10px] text-slate-400 uppercase">Type</TableHead>
                      <TableHead className="font-mono text-[10px] text-slate-400 uppercase">Value / Resource</TableHead>
                      <TableHead className="font-mono text-[10px] text-slate-400 uppercase">Confidence rating</TableHead>
                      <TableHead className="font-mono text-[10px] text-slate-400 uppercase">Attribution</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredIocs.length > 0 ? (
                      filteredIocs.map(ioc => {
                        // Color threshold by confidence
                        let confColor = "text-primary border-primary/25 bg-primary/5";
                        if (ioc.confidence < 0.4) confColor = "text-blue-400 border-blue-400/25 bg-blue-400/5";
                        else if (ioc.confidence < 0.75) confColor = "text-amber-500 border-amber-500/25 bg-amber-500/5";

                        return (
                          <TableRow key={ioc.id} className="border-border/60 hover:bg-slate-900/30">
                            <TableCell>
                              <Badge variant="outline" className="uppercase font-mono text-[9px] tracking-wider border-slate-700 bg-slate-900 text-slate-300">
                                {ioc.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-slate-200">{ioc.value}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className={`font-mono text-[9px] px-1.5 py-0.5 ${confColor}`}>
                                  {(ioc.confidence * 100).toFixed(0)}%
                                </Badge>
                                <div className="h-1.5 w-16 bg-slate-900 border border-border/50 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${
                                      ioc.confidence < 0.4 
                                        ? "bg-blue-400" 
                                        : ioc.confidence < 0.75 
                                          ? "bg-amber-500" 
                                          : "bg-primary"
                                    }`}
                                    style={{ width: `${ioc.confidence * 100}%` }}
                                  />
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-bold text-slate-400">
                              {ioc.associatedActor || (
                                <span className="text-muted-foreground/60 italic font-normal">UNATTRIBUTED</span>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center font-mono text-xs text-muted-foreground">
                          No indicators matching query found.
                        </TableCell>
                      </TableRow>
                    )}
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
