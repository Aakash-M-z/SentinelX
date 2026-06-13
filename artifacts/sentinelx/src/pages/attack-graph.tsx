import { useGetAttackGraph } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Network, Server, Database, Router as RouterIcon, Monitor, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function AttackGraph() {
  const { data: graph, isLoading } = useGetAttackGraph({ query: { refetchInterval: 3000 } as any });

  const getIcon = (type: string, status: string) => {
    const baseClass = "w-4.5 h-4.5";
    let colorClass = "text-muted-foreground";
    
    if (status === 'compromised') colorClass = "text-destructive animate-bounce";
    else if (status === 'targeted') colorClass = "text-warning";
    else if (status === 'healthy' || status === 'intact') colorClass = "text-green-500";
    
    switch(type) {
      case 'database': return <Database className={`${baseClass} ${colorClass}`} />;
      case 'router': return <RouterIcon className={`${baseClass} ${colorClass}`} />;
      case 'workstation': return <Monitor className={`${baseClass} ${colorClass}`} />;
      default: return <Server className={`${baseClass} ${colorClass}`} />;
    }
  };

  const getStatusBorder = (status: string) => {
    switch(status) {
      case 'compromised': return 'border-destructive shadow-lg shadow-destructive/20';
      case 'targeted': return 'border-warning';
      default: return 'border-green-500/45';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attack Graph</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visualizes current red-team compromise vectors, lateral movement trajectories, and historical penetration paths.
          </p>
        </div>
      </div>

      <Card className="glass-panel flex-1 flex flex-col overflow-hidden min-h-0">
        <CardHeader className="pb-3 border-b border-border/50">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Live Attack Path Visualization
            </CardTitle>
            {graph && (graph.compromisedPath ?? []).length > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1 font-mono">
                <Flame className="w-3.5 h-3.5" /> {(graph.compromisedPath ?? []).length} compromised nodes
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 relative p-0 bg-slate-50/50 dark:bg-slate-950/20 overflow-auto">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono">
              Loading attack path graph...
            </div>
          ) : !graph || graph.nodes.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono">
              No attack path data available. Start the simulation to populate graph.
            </div>
          ) : (
            <div className="w-full h-full min-w-[780px] min-h-[680px] p-4 flex items-center justify-center">
              <svg
                viewBox="0 0 800 700"
                className="w-full max-w-[800px] h-auto aspect-[8/7]"
              >
                {/* SVG Definitions */}
                <defs>
                  <marker
                    id="arrow-default"
                    viewBox="0 0 10 10"
                    refX="22"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" className="fill-muted-foreground/40" />
                  </marker>
                  <marker
                    id="arrow-compromised"
                    viewBox="0 0 10 10"
                    refX="22"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" className="fill-destructive" />
                  </marker>
                </defs>

                {/* Draw Attack Path Connections (Edges) */}
                {graph.edges.map((edge, idx) => {
                  const sourceNode = graph.nodes.find(n => n.id === edge.source);
                  const targetNode = graph.nodes.find(n => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;

                  const x1 = sourceNode.x ?? 0;
                  const y1 = sourceNode.y ?? 0;
                  const x2 = targetNode.x ?? 0;
                  const y2 = targetNode.y ?? 0;

                  const isCompromised = sourceNode.status === 'compromised' && targetNode.status === 'compromised';
                  const isTargeted = targetNode.status === 'targeted' || targetNode.status === 'compromised';

                  let strokeClass = "stroke-muted-foreground/30";
                  let markerId = "url(#arrow-default)";
                  let payloadColor = "fill-primary/60";

                  if (isCompromised) {
                    strokeClass = "stroke-destructive stroke-[2.5]";
                    markerId = "url(#arrow-compromised)";
                    payloadColor = "fill-destructive";
                  } else if (isTargeted) {
                    strokeClass = "stroke-warning/60 stroke-[1.5] stroke-dash";
                  }

                  const pathD = `M ${x1} ${y1} L ${x2} ${y2}`;

                  return (
                    <g key={`edge-${idx}`}>
                      <path
                        d={pathD}
                        markerEnd={markerId}
                        className={`fill-none ${strokeClass} transition-colors duration-500`}
                      />
                      {/* Exploit Payload Simulation Flow */}
                      {isCompromised && (
                        <circle r={3} className={`${payloadColor}`}>
                          <animateMotion
                            dur="2.5s"
                            repeatCount="indefinite"
                            path={pathD}
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}

                {/* Draw Exploit Nodes (Vertices) */}
                {graph.nodes.map((node) => {
                  const x = node.x ?? 0;
                  const y = node.y ?? 0;
                  const isCompromised = node.status === 'compromised';
                  const isTargeted = node.status === 'targeted';

                  const pulseRing = isCompromised ? (
                    <circle cx={x} cy={y} r={21} className="stroke-destructive/40 fill-none animate-ping" strokeWidth={1.5} />
                  ) : isTargeted ? (
                    <circle cx={x} cy={y} r={21} className="stroke-warning/40 fill-none animate-ping" strokeWidth={1.5} />
                  ) : null;

                  return (
                    <g key={node.id} className="group">
                      {pulseRing}

                      <foreignObject
                        x={x - 16}
                        y={y - 16}
                        width={32}
                        height={32}
                        className="overflow-visible pointer-events-none"
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center bg-card border-2 shadow-sm transition-all duration-300 pointer-events-auto ${getStatusBorder(node.status)}`}
                        >
                          {getIcon(node.type, node.status)}
                        </div>
                      </foreignObject>

                      <text
                        x={x}
                        y={y + 26}
                        textAnchor="middle"
                        className="text-[10px] font-mono font-bold fill-foreground group-hover:fill-primary transition-colors select-none pointer-events-none"
                      >
                        {node.label}
                      </text>
                      
                      <text
                        x={x}
                        y={y + 37}
                        textAnchor="middle"
                        className="text-[8px] font-mono uppercase font-semibold tracking-wider fill-muted-foreground select-none pointer-events-none"
                      >
                        {node.status}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
