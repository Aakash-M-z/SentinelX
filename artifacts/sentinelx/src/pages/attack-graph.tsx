import { useGetAttackGraph, useGetAsset } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Network, Server, Database, Router as RouterIcon, Monitor, ShieldAlert, Key, Flame } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type GraphNode = {
  id: string;
  label: string;
  type: string;
  status: string;
  assetId: number | null;
  riskScore: number | null;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number;
  fy: number;
};

type GraphEdge = {
  source: string;
  target: string;
  technique: string;
  status: string;
  progress: number; // for animations
};

export default function AttackGraph() {
  const { data: rawGraph, isLoading } = useGetAttackGraph({ query: { refetchInterval: 5000 } as any });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Interactive navigation states
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.9);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 550 });
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

  const getDynamicNodeStatus = (nodeId: string) => {
    if (activeStage < 0) return "healthy";
    
    switch (nodeId) {
      case "asset_1": // Internet Gateway
        return "compromised";
      case "asset_4": // Core Switch
        return activeStage >= 2 ? "compromised" : activeStage >= 1 ? "targeted" : "healthy";
      case "asset_2": // Web Server
        return activeStage >= 3 ? "compromised" : activeStage >= 2 ? "targeted" : "healthy";
      case "asset_8": // Database Server
        return activeStage >= 5 ? "compromised" : activeStage >= 4 ? "targeted" : "healthy";
      case "asset_7": // Domain Controller
        return activeStage >= 6 ? "compromised" : activeStage >= 5 ? "targeted" : "healthy";
      case "asset_5": // Workstation WS-001
        return activeStage >= 7 ? "compromised" : "healthy";
      case "asset_3": // Mail Gateway
        return activeStage >= 2 ? "targeted" : "healthy";
      case "asset_6": // Dev Server
        return activeStage >= 5 ? "targeted" : "healthy";
      case "asset_9": // Management Console
        return activeStage >= 6 ? "targeted" : "healthy";
      default:
        return "healthy";
    }
  };

  const getDynamicRiskScore = (nodeId: string, baseRisk: number | null) => {
    if (activeStage < 0) return baseRisk;
    
    switch (nodeId) {
      case "asset_1": return 95;
      case "asset_4": return activeStage >= 2 ? 80 : activeStage >= 1 ? 40 : 10;
      case "asset_2": return activeStage >= 3 ? 90 : activeStage >= 2 ? 30 : 5;
      case "asset_8": return activeStage >= 5 ? 95 : activeStage >= 4 ? 35 : 10;
      case "asset_7": return activeStage >= 6 ? 98 : activeStage >= 5 ? 45 : 5;
      case "asset_5": return activeStage >= 7 ? 85 : 5;
      default: return baseRisk;
    }
  };

  // Side-details hook for clicked nodes mapping to db assets
  const activeAssetId = rawGraph?.nodes.find(n => n.id === selectedNodeId)?.assetId;
  const { data: selectedAsset } = useGetAsset(activeAssetId!, {
    query: { enabled: !!activeAssetId, queryKey: ['asset', activeAssetId] }
  });

  // Local physics graph states
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const draggedNodeId = useRef<string | null>(null);
  const previousMouse = useRef({ x: 0, y: 0 });
  const isPanning = useRef(false);

  // ResizeObserver to support 4K/high-DPI dynamically
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width: width || 800, height: height || 550 });
      }
    });

    resizeObserver.observe(parent);
    return () => resizeObserver.disconnect();
  }, []);

  // Initialize/sync nodes when API returns new graph structure
  useEffect(() => {
    if (!rawGraph) return;

    // Preserve locations for existing nodes to prevent jumpiness on poll
    const existingMap = new Map(nodesRef.current.map(n => [n.id, n]));
    
    const width = dimensions.width;
    const height = dimensions.height;
    
    nodesRef.current = rawGraph.nodes.map((node, idx) => {
      const existing = existingMap.get(node.id);
      if (existing) {
        existing.status = getDynamicNodeStatus(node.id);
        existing.riskScore = getDynamicRiskScore(node.id, node.riskScore ?? null);
        return existing;
      }

      // Arrange around center circular grid
      const angle = (idx / rawGraph.nodes.length) * Math.PI * 2;
      const radius = 180 + Math.random() * 40;
      return {
        id: node.id,
        label: node.label,
        type: node.type,
        status: getDynamicNodeStatus(node.id),
        assetId: node.assetId ?? null,
        riskScore: getDynamicRiskScore(node.id, node.riskScore ?? null),
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        fx: 0,
        fy: 0,
      };
    });

    edgesRef.current = rawGraph.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      technique: edge.technique,
      status: edge.status || "inactive",
      progress: Math.random(),
    }));
  }, [rawGraph, dimensions, activeStage]);

  // Main force-directed physics simulator loop
  useEffect(() => {
    let animationId: number;

    const tick = () => {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const canvas = canvasRef.current;
      if (!canvas || nodes.length === 0) {
        animationId = requestAnimationFrame(tick);
        return;
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const w = dimensions.width;
      const h = dimensions.height;

      // Adjust drawing buffer dimensions for high-DPI crisp lines
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.scale(dpr, dpr);

      // --- 1. PHYSICS SIMULATION ---
      const K_repel = 3500;  // Repulsion coefficient
      const K_spring = 0.055; // Elasticity tension
      const rest_len = 135;  // Springs rest length
      const K_gravity = 0.018; // Centering gravity pull
      const friction = 0.88; // Friction dampener

      // Coulomb Repulsion
      for (let i = 0; i < nodes.length; i++) {
        const n1 = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          let dx = n1.x - n2.x;
          let dy = n1.y - n2.y;
          if (dx === 0 && dy === 0) {
            dx = 0.1;
            dy = 0.1;
          }
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < 300) {
            const force = K_repel / (d * d);
            const fx = force * (dx / d);
            const fy = force * (dy / d);
            
            if (n1.id !== draggedNodeId.current) {
              n1.fx += fx;
              n1.fy += fy;
            }
            if (n2.id !== draggedNodeId.current) {
              n2.fx -= fx;
              n2.fy -= fy;
            }
          }
        }
      }

      // Spring Tension
      edges.forEach(edge => {
        const n1 = nodes.find(n => n.id === edge.source);
        const n2 = nodes.find(n => n.id === edge.target);
        if (!n1 || !n2) return;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const d = Math.sqrt(dx*dx + dy*dy);
        if (d === 0) return;

        const force = K_spring * (d - rest_len);
        const fx = force * (dx / d);
        const fy = force * (dy / d);

        if (n1.id !== draggedNodeId.current) {
          n1.fx += fx;
          n1.fy += fy;
        }
        if (n2.id !== draggedNodeId.current) {
          n2.fx -= fx;
          n2.fy -= fy;
        }
      });

      // Gravity and Updates
      const cx = w / 2;
      const cy = h / 2;
      nodes.forEach(node => {
        if (node.id === draggedNodeId.current) {
          node.fx = 0;
          node.fy = 0;
          return;
        }

        node.fx += (cx - node.x) * K_gravity;
        node.fy += (cy - node.y) * K_gravity;

        node.vx = (node.vx + node.fx) * friction;
        node.vy = (node.vy + node.fy) * friction;

        node.x += node.vx;
        node.y += node.vy;

        node.fx = 0;
        node.fy = 0;
      });

      // Save state and apply transformations
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw grid lines
      ctx.strokeStyle = "rgba(255, 23, 68, 0.02)";
      ctx.lineWidth = 0.8;
      const gridSize = 45;
      const viewLeft = -pan.x / zoom;
      const viewTop = -pan.y / zoom;
      const viewRight = (w - pan.x) / zoom;
      const viewBottom = (h - pan.y) / zoom;

      ctx.beginPath();
      for (let x = Math.floor(viewLeft / gridSize) * gridSize; x < viewRight; x += gridSize) {
        ctx.moveTo(x, viewTop);
        ctx.lineTo(x, viewBottom);
      }
      for (let y = Math.floor(viewTop / gridSize) * gridSize; y < viewBottom; y += gridSize) {
        ctx.moveTo(viewLeft, y);
        ctx.lineTo(viewRight, y);
      }
      ctx.stroke();

      // A. Draw Edges (Attack Chains)
      edges.forEach(edge => {
        const source = nodes.find(n => n.id === edge.source);
        const target = nodes.find(n => n.id === edge.target);
        if (!source || !target) return;

        const sourceStatus = getDynamicNodeStatus(source.id);
        const targetStatus = getDynamicNodeStatus(target.id);

        const isCompromised = sourceStatus === "compromised" && targetStatus === "compromised";
        const isTargeted = targetStatus === "targeted" || targetStatus === "compromised";

        let strokeColor = "rgba(255, 255, 255, 0.12)";
        let lineWidth = 1.5;

        if (isCompromised) {
          strokeColor = "rgba(255, 23, 68, 0.55)";
          lineWidth = 2.5;
        } else if (isTargeted) {
          strokeColor = "rgba(245, 158, 11, 0.35)";
          lineWidth = 1.8;
        }

        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.stroke();

        // Dash offset flow streams
        if (isCompromised) {
          ctx.save();
          ctx.strokeStyle = "rgba(255, 23, 68, 0.8)";
          ctx.lineWidth = 2.0;
          ctx.setLineDash([6, 12]);
          ctx.lineDashOffset = -Date.now() * 0.045;
          ctx.beginPath();
          ctx.moveTo(source.x, source.y);
          ctx.lineTo(target.x, target.y);
          ctx.stroke();
          ctx.restore();

          edge.progress += 0.01;
          if (edge.progress > 1) edge.progress = 0;
          
          const packetX = source.x + (target.x - source.x) * edge.progress;
          const packetY = source.y + (target.y - source.y) * edge.progress;

          ctx.fillStyle = "#FF1744";
          ctx.shadowColor = "#FF1744";
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(packetX, packetY, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      });

      // B. Draw Nodes (Assets)
      nodes.forEach(node => {
        const isSelected = selectedNodeId === node.id;
        const status = getDynamicNodeStatus(node.id);
        const isCompromised = status === "compromised";
        const isTargeted = status === "targeted";

        // Halos
        if (isCompromised) {
          ctx.strokeStyle = "rgba(255, 23, 68, 0.18)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(node.x, node.y, 24 + Math.sin(Date.now() / 150) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Selected corner brackets
        if (isSelected) {
          ctx.strokeStyle = "#FF1744";
          ctx.lineWidth = 1.8;
          const r = 26;
          
          ctx.beginPath();
          ctx.moveTo(node.x - r, node.y - r + 8);
          ctx.lineTo(node.x - r, node.y - r);
          ctx.lineTo(node.x - r + 8, node.y - r);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(node.x + r, node.y - r + 8);
          ctx.lineTo(node.x + r, node.y - r);
          ctx.lineTo(node.x + r - 8, node.y - r);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(node.x - r, node.y + r - 8);
          ctx.lineTo(node.x - r, node.y + r);
          ctx.lineTo(node.x - r + 8, node.y + r);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(node.x + r, node.y + r - 8);
          ctx.lineTo(node.x + r, node.y + r);
          ctx.lineTo(node.x + r - 8, node.y + r);
          ctx.stroke();
        }

        // Draw body
        ctx.beginPath();
        ctx.arc(node.x, node.y, 16, 0, Math.PI * 2);
        
        let fillColor = "#0F0F14";
        let strokeColor = "rgba(255, 255, 255, 0.25)";
        if (isCompromised) {
          fillColor = "rgba(255, 23, 68, 0.08)";
          strokeColor = "#FF1744";
        } else if (isTargeted) {
          strokeColor = "#f59e0b";
        } else if (status === "healthy") {
          strokeColor = "#22c55e";
        }

        ctx.lineWidth = isSelected ? 2.5 : 1.5;
        ctx.fillStyle = fillColor;
        ctx.fill();
        ctx.strokeStyle = strokeColor;
        ctx.stroke();

        ctx.strokeStyle = isCompromised ? "rgba(255, 23, 68, 0.3)" : "rgba(255,255,255,0.08)";
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 11, 0, Math.PI * 2);
        ctx.stroke();

        // Icon text
        ctx.font = "bold 9px Space Mono";
        ctx.fillStyle = isCompromised ? "#FF1744" : isTargeted ? "#f59e0b" : "#94a3b8";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        let iconChar = "S";
        if (node.type === "database") iconChar = "DB";
        else if (node.type === "router") iconChar = "R";
        else if (node.type === "workstation") iconChar = "WS";
        else if (node.type === "switch") iconChar = "SW";
        ctx.fillText(iconChar, node.x, node.y + 0.5);

        // Name labels
        ctx.font = "bold 9px Space Grotesk";
        ctx.fillStyle = isSelected ? "#FF1744" : "rgba(255,255,255,0.95)";
        ctx.fillText(node.label, node.x, node.y + 28);

        ctx.font = "7px Space Mono";
        ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
        ctx.fillText(status.toUpperCase(), node.x, node.y + 37);

        // Risk score bar
        const rScore = getDynamicRiskScore(node.id, node.riskScore);
        if (rScore !== null) {
          const barW = 32;
          const barH = 3;
          const fraction = Math.min(100, Math.max(0, rScore)) / 100;
          const rx = node.x - barW / 2;
          const ry = node.y + 44;
          
          ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
          ctx.fillRect(rx, ry, barW, barH);
          
          ctx.fillStyle = rScore > 75 ? "#FF1744" : rScore > 40 ? "#f59e0b" : "#22c55e";
          ctx.fillRect(rx, ry, barW * fraction, barH);
        }
      });

      ctx.restore();

      // HUD Coordinate margins
      ctx.font = "7px Space Mono";
      ctx.fillStyle = "rgba(255, 23, 68, 0.3)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const borderPadding = 18;
      const numCols = 10;
      for (let col = 1; col < numCols; col++) {
        const xCoord = borderPadding + (col / numCols) * (w - borderPadding * 2);
        const charCode = String.fromCharCode(64 + col);
        ctx.fillText(charCode, xCoord, borderPadding / 2);
        ctx.fillText(charCode, xCoord, h - borderPadding / 2);
      }

      const numRows = 7;
      for (let row = 1; row < numRows; row++) {
        const yCoord = borderPadding + (row / numRows) * (h - borderPadding * 2);
        ctx.fillText(String(row), borderPadding / 2, yCoord);
        ctx.fillText(String(row), w - borderPadding / 2, yCoord);
      }

      ctx.restore();
      animationId = requestAnimationFrame(tick);
    };

    tick();

    return () => cancelAnimationFrame(animationId);
  }, [selectedNodeId, pan, zoom, dimensions, activeStage]);

  const getMouseCoord = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    
    const x = (clientX - rect.left - pan.x) / zoom;
    const y = (clientY - rect.top - pan.y) / zoom;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const coord = getMouseCoord(e.clientX, e.clientY);
    const clickedNode = nodesRef.current.find(node => {
      const dx = node.x - coord.x;
      const dy = node.y - coord.y;
      return Math.sqrt(dx*dx + dy*dy) < 22;
    });

    if (clickedNode) {
      draggedNodeId.current = clickedNode.id;
      setSelectedNodeId(clickedNode.id);
    } else {
      isPanning.current = true;
    }
    previousMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId.current) {
      const coord = getMouseCoord(e.clientX, e.clientY);
      const node = nodesRef.current.find(n => n.id === draggedNodeId.current);
      if (node) {
        node.x = coord.x;
        node.y = coord.y;
        node.vx = 0;
        node.vy = 0;
      }
    } else if (isPanning.current) {
      const deltaX = e.clientX - previousMouse.current.x;
      const deltaY = e.clientY - previousMouse.current.y;
      setPan(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }));
    }
    previousMouse.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    draggedNodeId.current = null;
    isPanning.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.05;
    if (e.deltaY < 0) {
      setZoom(prev => Math.min(2.5, prev * zoomFactor));
    } else {
      setZoom(prev => Math.max(0.4, prev / zoomFactor));
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(2.5, prev * 1.2));
  const handleZoomOut = () => setZoom(prev => Math.max(0.4, prev / 1.2));
  const handleResetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(0.9);
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'compromised': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'targeted': return 'bg-warning/10 text-warning border-warning/20';
      case 'healthy': return 'bg-green-500/10 text-green-500 border-green-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6 bg-transparent">
      <div className="flex items-center justify-between border-b border-slate-900 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-glow">ATTACK GRAPH</h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono uppercase tracking-wider">
            Force-Directed Penetration Path Tracker // Active exploit nodes
          </p>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 items-stretch">
        <Card className="glass-panel flex-1 flex flex-col overflow-hidden min-h-[500px]">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Interactive Exploit Vector Web</CardTitle>
              <CardDescription>Drag nodes to reorganize graph hierarchy. Scroll to zoom, drag background to pan.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleZoomIn} variant="outline" className="border-slate-800 h-8 w-8 p-0 text-slate-400 hover:text-white font-mono text-xs">+</Button>
              <Button onClick={handleZoomOut} variant="outline" className="border-slate-800 h-8 w-8 p-0 text-slate-400 hover:text-white font-mono text-xs">-</Button>
              <Button onClick={handleResetView} variant="outline" className="border-slate-800 h-8 px-2 text-xs text-slate-400 hover:text-white font-mono">RESET</Button>
            </div>
          </CardHeader>
          <CardContent 
            className="flex-1 relative p-0 bg-slate-950/20 overflow-hidden"
            onWheel={handleWheel}
          >
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground font-mono">
                Loading attack paths...
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                className="w-full h-full cursor-grab active:cursor-grabbing"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              />
            )}
          </CardContent>
        </Card>

        {selectedNodeId && (
          <Card className="glass-panel w-80 shrink-0 flex flex-col overflow-hidden">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center justify-between">
                <CardTitle className="font-mono text-xs text-slate-400 uppercase">Exploit Node Details</CardTitle>
                <button 
                  onClick={() => setSelectedNodeId(null)}
                  className="text-slate-500 hover:text-white font-mono text-xs"
                >
                  CLOSE
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-6">
              {selectedAsset ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold tracking-tight text-glow flex items-center gap-1.5">
                      {selectedAsset.name}
                    </h3>
                    <p className="text-sm font-mono text-slate-400 mt-0.5">{selectedAsset.ipAddress}</p>
                  </div>
                  
                  <div className="space-y-3 font-mono text-sm border-t border-b border-slate-900 py-4">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Node Status:</span>
                      <Badge variant="outline" className={`capitalize select-none ${getStatusBadgeColor(getDynamicNodeStatus(selectedNodeId))}`}>
                        {getDynamicNodeStatus(selectedNodeId).toUpperCase()}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Network Zone:</span>
                      <span className="uppercase font-semibold text-primary">{selectedAsset.zone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Risk Score:</span>
                      <span className="font-semibold text-amber-500">
                        {getDynamicRiskScore(selectedNodeId, selectedAsset.compromiseLevel)}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-[#FF1744]/75 mb-2.5 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" /> Listening Ports
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedAsset.services.map(s => (
                        <Badge key={s} variant="secondary" className="text-[10px] bg-slate-900 text-slate-300 border border-slate-800 font-mono">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-xs font-bold font-mono tracking-wider uppercase text-destructive mb-2.5 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-destructive" /> CVE Impact Mappings
                    </h4>
                    {selectedAsset.vulnerabilities && selectedAsset.vulnerabilities.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedAsset.vulnerabilities.map(v => (
                          <li key={v} className="text-[10px] p-2 rounded bg-destructive/5 border border-destructive/10 text-destructive font-mono flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-destructive shrink-0"></span>
                            {v}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="text-[10px] p-2 rounded bg-green-500/5 border border-green-500/10 text-green-400 font-mono flex items-center gap-2">
                        No active exploits discovered
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-slate-800 rounded w-1/2"></div>
                  <div className="h-4 bg-slate-800 rounded w-3/4"></div>
                  <div className="h-20 bg-slate-800 rounded"></div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
