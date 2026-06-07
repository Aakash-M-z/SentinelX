import { useGetAttackGraph } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Network } from "lucide-react";
import { useEffect, useRef } from "react";

export default function AttackGraph() {
  const { data: graph } = useGetAttackGraph({ query: { refetchInterval: 5000 } });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!graph || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Very simplified placeholder rendering for attack graph
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw edges
    graph.edges.forEach(edge => {
      ctx.beginPath();
      // Mock coordinates
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.strokeStyle = edge.status === 'success' ? '#ef4444' : '#3b82f6';
      ctx.stroke();
    });

    // Draw nodes
    graph.nodes.forEach(node => {
      const x = Math.random() * canvas.width;
      const y = Math.random() * canvas.height;
      ctx.beginPath();
      ctx.arc(x, y, 10, 0, 2 * Math.PI);
      ctx.fillStyle = node.status === 'compromised' ? '#ef4444' : '#22c55e';
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(node.label, x + 15, y);
    });
  }, [graph]);

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Attack Graph</h1>
      </div>

      <Card className="glass-panel flex-1 min-h-0">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Network className="mr-2 h-5 w-5 text-primary" />
            Live Attack Path Visualization
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[calc(100%-5rem)] relative">
          <div className="absolute inset-0 bg-secondary/20 rounded-md border border-border overflow-hidden">
            <canvas 
              ref={canvasRef}
              width={800} 
              height={600} 
              className="w-full h-full object-contain"
            />
            {!graph && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                Loading graph data...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
