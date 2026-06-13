import { useGetNetworkTopology, useGetAsset } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server, Database, Router as RouterIcon, Monitor, ShieldCheck, ShieldAlert, Key, Terminal, Skull, AlertCircle, Compass } from "lucide-react";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";

// 8 Stages of Simulation Attack Chain
const SIM_STAGES = [
  { name: "Reconnaissance", mitre: "TA0043 / Active Scanning", risk: 12, asset: "Internet Gateway", log: "DNS scan discovered open gateways." },
  { name: "Scanning", mitre: "T1046 / Service Discovery", risk: 25, asset: "Core Switch", log: "Port sweep targeting network switches." },
  { name: "Vulnerability Discovery", mitre: "T1595 / Vuln Scanning", risk: 38, asset: "Web Server", log: "Web framework vulnerability audited." },
  { name: "Exploitation", mitre: "T1210 / Exploit Remote Services", risk: 54, asset: "Web Server", log: "RCE payload delivered. Shell established." },
  { name: "Privilege Escalation", mitre: "T1068 / Privilege Escalation", risk: 68, asset: "Web Server", log: "Root access escalated via local exploit." },
  { name: "Lateral Movement", mitre: "T1021 / Remote Services", risk: 80, asset: "Database Server", log: "SSH pivoting from Web Server to DB Server." },
  { name: "Persistence", mitre: "T1053 / Scheduled Task", risk: 92, asset: "Domain Controller", log: "Backdoor service registered on Domain Controller." },
  { name: "Data Exfiltration", mitre: "T1048 / Data Leakage", risk: 98, asset: "Database Server", log: "Compressed DB archives exfiltrated via tunnel." }
];

export default function CyberRange() {
  const { data: topology, isLoading } = useGetNetworkTopology();
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  const [activeStage, setActiveStage] = useState<number>(-1);

  // Sync simulation status from localStorage
  useEffect(() => {
    const checkStage = () => {
      const stageVal = localStorage.getItem("sentinelx_sim_stage");
      if (stageVal !== null) {
        setActiveStage(parseInt(stageVal));
      } else {
        setActiveStage(-1);
      }
    };
    checkStage();
    const interval = setInterval(checkStage, 1000);
    return () => clearInterval(interval);
  }, []);

  const getDynamicAssetStatus = (name: string) => {
    if (activeStage < 0) return { status: "healthy", compromise: 0 };
    
    switch (name) {
      case "Internet Gateway":
        return { status: "compromised", compromise: 100 };
      case "Core Switch":
        return activeStage >= 1 
          ? { status: activeStage >= 2 ? "compromised" : "targeted", compromise: activeStage >= 2 ? 100 : 40 }
          : { status: "healthy", compromise: 0 };
      case "Web Server":
        return activeStage >= 3 
          ? { status: "compromised", compromise: 100 }
          : activeStage >= 2 
            ? { status: "targeted", compromise: 30 }
            : { status: "healthy", compromise: 0 };
      case "Database Server":
        return activeStage >= 5 
          ? { status: "compromised", compromise: 100 }
          : activeStage >= 4 
            ? { status: "targeted", compromise: 35 }
            : { status: "healthy", compromise: 0 };
      case "Domain Controller":
        return activeStage >= 6 
          ? { status: "compromised", compromise: 100 }
          : activeStage >= 5 
            ? { status: "targeted", compromise: 45 }
            : { status: "healthy", compromise: 0 };
      case "Workstation WS-001":
        return activeStage >= 7 
          ? { status: "compromised", compromise: 100 }
          : { status: "healthy", compromise: 0 };
      case "Dev Server":
        return activeStage >= 5 
          ? { status: "targeted", compromise: 20 }
          : { status: "healthy", compromise: 0 };
      default:
        return { status: "healthy", compromise: 0 };
    }
  };

  const { data: selectedAsset } = useGetAsset(selectedAssetId!, {
    query: { enabled: !!selectedAssetId, queryKey: ['asset', selectedAssetId] }
  });

  const getIcon = (type: string, status: string) => {
    const baseClass = "w-5 h-5 transition-transform duration-300 group-hover:scale-110";
    let colorClass = "text-muted-foreground";
    
    if (status === 'compromised') colorClass = "text-destructive animate-pulse";
    else if (status === 'targeted') colorClass = "text-warning animate-pulse";
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
    <div className="p-6 h-full flex flex-col space-y-6 bg-transparent">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-glow">CYBER RANGE MAP</h1>
          <p className="text-sm text-slate-400 mt-1 font-mono uppercase tracking-wider">
            Real-Time Interactive Subnet Topology & Attacker Movement
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 min-h-0 items-stretch">
        
        {/* LEFT COLUMN: Topology Map (8/12 width) */}
        <Card className="glass-panel lg:col-span-8 flex flex-col overflow-hidden min-h-[550px]">
          <CardHeader className="pb-3 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-mono text-xs font-bold uppercase tracking-widest text-slate-400">Range Subnet Overlay</CardTitle>
              </div>
              <div className="flex gap-4 font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-green-500"></span> Healthy</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-warning animate-pulse"></span> Targeted</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-destructive animate-ping"></span> Compromised</span>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 relative p-0 bg-slate-950/20 overflow-auto">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono">
                Loading network topology...
              </div>
            ) : (
              <div className="w-full h-full min-w-[780px] min-h-[720px] p-4 flex items-center justify-center">
                <svg viewBox="0 0 800 700" className="w-full max-w-[800px] h-auto aspect-[8/7]">
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

                    const dynamicSrc = getDynamicAssetStatus(sourceNode.name);
                    const dynamicTgt = getDynamicAssetStatus(targetNode.name);

                    const x1 = sourceNode.x ?? 0;
                    const y1 = sourceNode.y ?? 0;
                    const x2 = targetNode.x ?? 0;
                    const y2 = targetNode.y ?? 0;

                    const isCompromised = dynamicSrc.status === 'compromised' || dynamicTgt.status === 'compromised';
                    const isTargeted = dynamicSrc.status === 'targeted' || dynamicTgt.status === 'targeted';

                    let strokeClass = "stroke-muted-foreground/30";
                    let pulseColor = "fill-[#FF1744]/40";

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
                            dur={isCompromised ? "1.2s" : "3.2s"}
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
                    
                    const dynamicInfo = getDynamicAssetStatus(asset.name);
                    const isCompromised = dynamicInfo.status === 'compromised';
                    const isTargeted = dynamicInfo.status === 'targeted';

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
                    else if (dynamicInfo.status === 'healthy') containerClass = "border-green-500/40 hover:border-green-500";

                    return (
                      <g key={asset.id} className="cursor-pointer group" onClick={() => setSelectedAssetId(asset.id)}>
                        {pulseRing}

                        <circle
                          cx={x}
                          cy={y}
                          r={25}
                          className="fill-transparent stroke-none"
                        />

                        <foreignObject
                          x={x - 18}
                          y={y - 18}
                          width={36}
                          height={36}
                          className="overflow-visible pointer-events-none"
                        >
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center bg-card border-2 shadow-sm transition-all duration-300 pointer-events-auto ${containerClass}`}
                          >
                            {getIcon(asset.type, dynamicInfo.status)}
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

        {/* RIGHT COLUMN: Attacker Command Room / Asset Details (4/12 width) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Attacker control room HUD */}
          <Card className="glass-panel border-primary/20 bg-primary/[0.015] p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-border pb-2.5">
              <Skull className="w-5 h-5 text-primary animate-pulse" />
              <h2 className="text-sm font-bold font-mono tracking-wider uppercase text-glow">Attacker Command Room</h2>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
                <span className="text-slate-500">ATTACKER IP:</span>
                <span className="text-primary font-bold">185.220.101.4</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
                <span className="text-slate-500">TUNNEL PROTOCOL:</span>
                <span className="text-slate-300">Encrypted Reverse HTTPS</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
                <span className="text-slate-500">EXPLOIT STAGE:</span>
                <span className="text-glow font-bold text-primary">
                  {activeStage >= 0 ? SIM_STAGES[activeStage].name.toUpperCase() : "IDLE"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-900">
                <span className="text-slate-500">MITRE TECHNIQUE:</span>
                <span className="text-slate-300">
                  {activeStage >= 0 ? SIM_STAGES[activeStage].mitre : "NONE"}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500">TARGET ASSET:</span>
                <span className="text-slate-300">
                  {activeStage >= 0 ? SIM_STAGES[activeStage].asset : "NONE"}
                </span>
              </div>
            </div>
          </Card>

          {/* Asset Details Inspector */}
          {selectedAssetId ? (
            <Card className="glass-panel flex-1 flex flex-col overflow-hidden min-h-[350px]">
              <CardHeader className="pb-3 border-b border-border/50 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="font-mono text-xs text-slate-400 uppercase">Asset Inspector</CardTitle>
                </div>
                <button 
                  onClick={() => setSelectedAssetId(null)}
                  className="text-slate-500 hover:text-white font-mono text-[10px]"
                >
                  CLOSE
                </button>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto p-5">
                {selectedAsset ? (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-base font-bold font-mono tracking-tight text-glow flex items-center gap-1.5">
                        {selectedAsset.name}
                      </h3>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">{selectedAsset.ipAddress}</p>
                    </div>
                    
                    <div className="space-y-2.5 font-mono text-xs border-t border-b border-slate-900 py-3.5">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Status:</span>
                        <Badge variant="outline" className={`capitalize select-none ${getStatusBadgeColor(getDynamicAssetStatus(selectedAsset.name).status)}`}>
                          {getDynamicAssetStatus(selectedAsset.name).status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Subnet Zone:</span>
                        <span className="uppercase text-slate-300 font-semibold">{selectedAsset.zone}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">OS Platform:</span>
                        <span className="font-semibold text-slate-300 truncate max-w-[140px]" title={selectedAsset.os}>{selectedAsset.os}</span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-[10px] font-bold font-mono tracking-wider uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-primary" /> Active Services
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedAsset.services.map(s => (
                          <Badge key={s} variant="secondary" className="text-[9px] bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="pt-1">
                      <h4 className="text-[10px] font-bold font-mono tracking-wider uppercase text-destructive mb-2 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5 text-destructive animate-pulse" /> Discoveries
                      </h4>
                      {selectedAsset.vulnerabilities && selectedAsset.vulnerabilities.length > 0 ? (
                        <ul className="space-y-1.5">
                          {selectedAsset.vulnerabilities.map(v => (
                            <li key={v} className="text-[9px] p-2 rounded bg-destructive/5 border border-destructive/10 text-destructive font-mono flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0 animate-ping"></span>
                              {v}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="text-[9px] p-2 rounded bg-green-500/5 border border-green-500/10 text-green-400 font-mono flex items-center gap-2">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-green-500" />
                          No vulnerabilities discovered
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="animate-pulse space-y-4 font-mono text-xs">
                    <div className="h-4 bg-slate-900 rounded w-1/2"></div>
                    <div className="h-4 bg-slate-900 rounded w-3/4"></div>
                    <div className="h-20 bg-slate-900 rounded"></div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            // Simulation play logs if no asset is selected
            <Card className="glass-panel flex-1 flex flex-col overflow-hidden min-h-[350px]">
              <CardHeader className="pb-3 border-b border-border/40">
                <CardTitle className="font-mono text-xs text-slate-400 uppercase flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" /> Active Simulation Logs
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-4 font-mono text-[10px] space-y-2.5 overflow-y-auto bg-black/20">
                {activeStage >= 0 ? (
                  SIM_STAGES.slice(0, activeStage + 1).map((stage, idx) => (
                    <div key={idx} className="border-b border-slate-900/60 pb-2">
                      <div className="flex justify-between items-center text-primary font-bold">
                        <span>STAGE {idx + 1}: {stage.name}</span>
                        <span>[DONE]</span>
                      </div>
                      <p className="text-slate-400 mt-1">{stage.log}</p>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 gap-2">
                    <AlertCircle className="w-8 h-8 text-slate-700" />
                    <span>SIMULATION IS CURRENTLY IDLE.<br/>CLICK START SIMULATION IN SOC DASHBOARD.</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  );
}
