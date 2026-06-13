import { useGetNetworkTopology, useListAssets, useGetAsset, useUpdateAssetCompromise, getListAssetsQueryKey, getGetNetworkTopologyQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server, Database, Router as RouterIcon, Monitor, ShieldCheck, ShieldAlert, Key } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function CyberRange() {
  const { data: topology, isLoading } = useGetNetworkTopology();
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  
  const { data: selectedAsset } = useGetAsset(selectedAssetId!, {
    query: { enabled: !!selectedAssetId, queryKey: ['asset', selectedAssetId] }
  });

  const getIcon = (type: string, status: string) => {
    const baseClass = "w-5 h-5 transition-transform duration-300 group-hover:scale-110";
    let colorClass = "text-muted-foreground";
    
    if (status === 'compromised') colorClass = "text-destructive animate-pulse";
    else if (status === 'targeted') colorClass = "text-warning";
    else if (status === 'healthy') colorClass = "text-green-500";
    
    switch(type) {
      case 'database': return <Database className={`${baseClass} ${colorClass}`} />;
      case 'router': return <RouterIcon className={`${baseClass} ${colorClass}`} />;
      case 'workstation': return <Monitor className={`${baseClass} ${colorClass}`} />;
      default: return <Server className={`${baseClass} ${colorClass}`} />;
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'compromised': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'targeted': return 'bg-warning/10 text-warning border-warning/20';
      case 'healthy': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const zonesConfig = [
    { id: "dmz", name: "DMZ Zone (External Public Services)", y: 20, height: 180, border: "stroke-amber-500/30", bg: "fill-amber-500/[0.02] dark:fill-amber-500/[0.01]", text: "fill-amber-600 dark:fill-amber-400" },
    { id: "internal", name: "Internal Network (Corporate Intranet)", y: 220, height: 230, border: "stroke-blue-500/30", bg: "fill-blue-500/[0.02] dark:fill-blue-500/[0.01]", text: "fill-blue-600 dark:fill-blue-400" },
    { id: "restricted", name: "Restricted Zone (Databases & Core Directory)", y: 470, height: 100, border: "stroke-rose-500/30", bg: "fill-rose-500/[0.02] dark:fill-rose-500/[0.01]", text: "fill-rose-600 dark:fill-rose-400" },
    { id: "management", name: "Out-of-Band Management System", y: 590, height: 90, border: "stroke-purple-500/30", bg: "fill-purple-500/[0.02] dark:fill-purple-500/[0.01]", text: "fill-purple-600 dark:fill-purple-400" },
  ];

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cyber Range Topology</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time interactive logical network map displaying connection paths, security metrics, and live traffic flows.
          </p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        <Card className="glass-panel flex-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Interactive Network Map</CardTitle>
                <CardDescription>Click on any network asset to inspect active services, OS details, and vulnerabilities.</CardDescription>
              </div>
              <div className="flex gap-4 text-xs font-mono">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-500"></span> Healthy</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Targeted</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span> Compromised</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 relative p-0 bg-slate-50/50 dark:bg-slate-950/20 overflow-auto">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono">
                Loading network topology...
              </div>
            ) : (
              <div className="w-full h-full min-w-[780px] min-h-[720px] p-4 flex items-center justify-center">
                <svg
                  viewBox="0 0 800 700"
                  className="w-full max-w-[800px] h-auto aspect-[8/7]"
                >
                  {/* Define SVG Markers/Effects */}
                  <defs>
                    <filter id="glow-red" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="3" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>

                  {/* Draw Network Zone Containers */}
                  {zonesConfig.map(zone => (
                    <g key={zone.id}>
                      <rect
                        x={20}
                        y={zone.y}
                        width={760}
                        height={zone.height}
                        rx={8}
                        className={`${zone.bg} ${zone.border} stroke-[1.5] fill-current`}
                        strokeDasharray="5 5"
                      />
                      <text
                        x={35}
                        y={zone.y + 22}
                        className={`font-mono text-[10px] font-bold tracking-wider ${zone.text} fill-current uppercase select-none`}
                      >
                        {zone.name}
                      </text>
                    </g>
                  ))}

                  {/* Draw Connections */}
                  {topology?.connections.map((conn, idx) => {
                    const sourceNode = topology.assets.find(a => a.id === conn.source);
                    const targetNode = topology.assets.find(a => a.id === conn.target);
                    if (!sourceNode || !targetNode) return null;

                    const x1 = sourceNode.x ?? 0;
                    const y1 = sourceNode.y ?? 0;
                    const x2 = targetNode.x ?? 0;
                    const y2 = targetNode.y ?? 0;

                    const isCompromised = sourceNode.status === 'compromised' || targetNode.status === 'compromised';
                    const isTargeted = sourceNode.status === 'targeted' || targetNode.status === 'targeted';

                    let strokeClass = "stroke-muted-foreground/30";
                    let pulseColor = "fill-primary/60";

                    if (isCompromised) {
                      strokeClass = "stroke-destructive/50";
                      pulseColor = "fill-destructive";
                    } else if (isTargeted) {
                      strokeClass = "stroke-warning/45";
                      pulseColor = "fill-warning";
                    }

                    const pathD = `M ${x1} ${y1} L ${x2} ${y2}`;

                    return (
                      <g key={`conn-${idx}`}>
                        <path
                          d={pathD}
                          className={`fill-none ${strokeClass} transition-colors duration-500`}
                          strokeWidth={conn.encrypted ? 1.5 : 2.5}
                          strokeDasharray={conn.encrypted ? "5 4" : undefined}
                        />
                        {/* Animated Packet Pulse */}
                        <circle r={isCompromised ? 3.5 : 2.5} className={`${pulseColor}`}>
                          <animateMotion
                            dur={isCompromised ? "1.5s" : "3.5s"}
                            repeatCount="indefinite"
                            path={pathD}
                          />
                        </circle>
                      </g>
                    );
                  })}

                  {/* Draw Nodes (Assets) */}
                  {topology?.assets.map((asset) => {
                    const x = asset.x ?? 0;
                    const y = asset.y ?? 0;
                    const isSelected = selectedAssetId === asset.id;
                    const isCompromised = asset.status === 'compromised';
                    const isTargeted = asset.status === 'targeted';

                    // Pulse glow outer ring for targeted/compromised nodes
                    const pulseRing = isCompromised ? (
                      <circle cx={x} cy={y} r={23} className="stroke-destructive/40 fill-none animate-ping" strokeWidth={1.5} />
                    ) : isTargeted ? (
                      <circle cx={x} cy={y} r={23} className="stroke-warning/40 fill-none animate-ping" strokeWidth={1.5} />
                    ) : null;

                    let containerClass = "border-border hover:border-primary/50";
                    if (isSelected) containerClass = "border-primary ring-2 ring-primary/20 scale-110";
                    else if (isCompromised) containerClass = "border-destructive shadow-lg shadow-destructive/20 hover:border-destructive/80";
                    else if (isTargeted) containerClass = "border-warning hover:border-warning/80";
                    else if (asset.status === 'healthy') containerClass = "border-green-500/40 hover:border-green-500";

                    return (
                      <g key={asset.id} className="cursor-pointer group">
                        {pulseRing}

                        <circle
                          cx={x}
                          cy={y}
                          r={25}
                          className="fill-transparent stroke-none"
                          onClick={() => setSelectedAssetId(asset.id)}
                        />

                        <foreignObject
                          x={x - 18}
                          y={y - 18}
                          width={36}
                          height={36}
                          className="overflow-visible pointer-events-none"
                        >
                          <div
                            onClick={() => setSelectedAssetId(asset.id)}
                            className={`w-9 h-9 rounded-full flex items-center justify-center bg-card border-2 shadow-sm transition-all duration-300 pointer-events-auto ${containerClass}`}
                          >
                            {getIcon(asset.type, asset.status)}
                          </div>
                        </foreignObject>

                        <text
                          x={x}
                          y={y + 30}
                          textAnchor="middle"
                          className="text-[10px] font-mono font-bold fill-foreground group-hover:fill-primary transition-colors select-none pointer-events-none"
                        >
                          {asset.name}
                        </text>
                        <text
                          x={x}
                          y={y + 41}
                          textAnchor="middle"
                          className="text-[9px] font-mono fill-muted-foreground select-none pointer-events-none"
                        >
                          {asset.ipAddress}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            )}
          </CardContent>
        </Card>

        {selectedAssetId && (
          <Card className="glass-panel w-80 shrink-0 flex flex-col overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/50">
              <CardTitle>Asset Details</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6">
              {selectedAsset ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight">{selectedAsset.name}</h3>
                    <p className="text-sm font-mono text-muted-foreground">{selectedAsset.ipAddress}</p>
                  </div>
                  
                  <div className="space-y-3 font-mono text-sm">
                    <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                      <span className="text-muted-foreground">Status:</span>
                      <Badge variant="outline" className={`capitalize select-none ${getStatusBadgeColor(selectedAsset.status)}`}>
                        {selectedAsset.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                      <span className="text-muted-foreground">Asset Type:</span>
                      <span className="capitalize font-semibold">{selectedAsset.type}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                      <span className="text-muted-foreground">Subnet Zone:</span>
                      <span className="uppercase font-semibold">{selectedAsset.zone}</span>
                    </div>
                    <div className="flex justify-between items-center py-1.5 border-b border-border/30">
                      <span className="text-muted-foreground">OS Platform:</span>
                      <span className="font-semibold text-xs text-right truncate max-w-[140px]" title={selectedAsset.os}>{selectedAsset.os}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-muted-foreground mb-2.5 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" /> Listening Services
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAsset.services.map(s => (
                        <Badge key={s} variant="secondary" className="text-xs bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-none font-mono">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-destructive mb-2.5 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-destructive" /> Active Vulnerabilities
                    </h4>
                    {selectedAsset.vulnerabilities && selectedAsset.vulnerabilities.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedAsset.vulnerabilities.map(v => (
                          <li key={v} className="text-xs p-2 rounded bg-destructive/5 border border-destructive/10 text-destructive font-mono flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0"></span>
                            {v}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-xs p-2 rounded bg-green-500/5 border border-green-500/10 text-green-600 dark:text-green-400 font-mono flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                        No active CVEs discovered
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-20 bg-muted rounded"></div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
