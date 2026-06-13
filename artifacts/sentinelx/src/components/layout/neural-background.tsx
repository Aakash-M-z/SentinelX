import { useEffect, useRef, useState } from "react";

type NeuralNode = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  vx: number;
  vy: number;
  size: number;
  depth: number; // 0 = background, 1 = midground, 2 = foreground
  pulsePhase: number;
  excitement: number;
};

type NeuralLink = {
  source: number;
  target: number;
  strength: number;
};

type NeuralPacket = {
  source: number;
  target: number;
  progress: number;
  speed: number;
  color: string;
  size: number;
};

export function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Parallax tracking
  const mouseRef = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 });
  const [activeStage, setActiveStage] = useState<number>(-1);
  const prevStageRef = useRef<number>(-1);

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

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationId: number;
    let width = window.innerWidth;
    let height = window.innerHeight;

    // High-DPI support
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Dynamic Nodes generation (~200 nodes)
    const numNodes = 200;
    const nodes: NeuralNode[] = [];

    for (let i = 0; i < numNodes; i++) {
      const depth = i % 3; // 0, 1, 2
      const x = Math.random() * width;
      const y = Math.random() * height;
      
      nodes.push({
        x,
        y,
        baseX: x,
        baseY: y,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        size: depth === 0 ? 1.0 : depth === 1 ? 1.8 : 2.6,
        depth,
        pulsePhase: Math.random() * Math.PI * 2,
        excitement: 0,
      });
    }

    // Connect nodes into clusters based on proximity
    const links: NeuralLink[] = [];
    for (let i = 0; i < numNodes; i++) {
      const n1 = nodes[i];
      let connections = 0;
      
      for (let j = i + 1; j < numNodes; j++) {
        if (connections >= 3) break; // limit density
        const n2 = nodes[j];
        
        // Connect only within the same or adjacent depth layers
        if (Math.abs(n1.depth - n2.depth) > 1) continue;

        const dx = n1.x - n2.x;
        const dy = n1.y - n2.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        const maxDist = n1.depth === 0 ? 95 : n1.depth === 1 ? 120 : 150;
        
        if (dist < maxDist) {
          links.push({
            source: i,
            target: j,
            strength: 1 - dist / maxDist,
          });
          connections++;
        }
      }
    }

    // Generate active packets flowing along links
    const numPackets = 45;
    const packets: NeuralPacket[] = [];
    const getAdjacentNodes = (nodeIdx: number) => {
      const adjacent: number[] = [];
      links.forEach(l => {
        if (l.source === nodeIdx) adjacent.push(l.target);
        else if (l.target === nodeIdx) adjacent.push(l.source);
      });
      return adjacent;
    };

    for (let i = 0; i < numPackets; i++) {
      // Pick random link
      if (links.length === 0) break;
      const link = links[Math.floor(Math.random() * links.length)];
      
      // Packet type/color selection
      const typeRand = Math.random();
      let color = "rgba(255, 23, 68, 0.45)"; // primary red
      if (typeRand > 0.75) color = "rgba(0, 230, 118, 0.45)"; // success green
      else if (typeRand > 0.45) color = "rgba(255, 255, 255, 0.35)"; // white telemetry

      packets.push({
        source: link.source,
        target: link.target,
        progress: Math.random(),
        speed: 0.003 + Math.random() * 0.006,
        color,
        size: Math.random() > 0.7 ? 2.2 : 1.4,
      });
    }

    // Radial Excitement Ripple Wave state
    let rippleActive = false;
    let rippleRadius = 0;
    let rippleX = width / 2;
    let rippleY = height / 2;
    const rippleSpeed = 8.5;
    const maxRippleRadius = Math.max(width, height) * 0.8;

    // Parallax mouse movements hook
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.targetX = (e.clientX - width / 2) * 0.045;
      mouseRef.current.targetY = (e.clientY - height / 2) * 0.045;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Frame render tick loop
    const tick = () => {
      // Easing mouse parallax offset
      const mouse = mouseRef.current;
      mouse.x += (mouse.targetX - mouse.x) * 0.08;
      mouse.y += (mouse.targetY - mouse.y) * 0.08;

      ctx.clearRect(0, 0, width, height);

      // Draw background cyber grid radial overlay
      const radialGlow = ctx.createRadialGradient(width / 2, height / 2, width * 0.1, width / 2, height / 2, width * 0.85);
      radialGlow.addColorStop(0, "rgba(255, 23, 68, 0.015)");
      radialGlow.addColorStop(0.5, "rgba(255, 23, 68, 0.005)");
      radialGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = radialGlow;
      ctx.fillRect(0, 0, width, height);

      // Simulation Stage Excitement Sync
      const isSimActive = activeStage >= 0;
      const baseNodeSpeed = isSimActive ? 1.6 : 1.0;
      const basePacketSpeed = isSimActive ? 1.8 : 1.0;

      // Handle Stage Transition Ripple Activation
      if (activeStage !== prevStageRef.current) {
        if (activeStage >= 0) {
          rippleActive = true;
          rippleRadius = 0;
          rippleX = width / 2;
          rippleY = height / 2;
        }
        prevStageRef.current = activeStage;
      }

      // Progress ripple wave
      if (rippleActive) {
        rippleRadius += rippleSpeed;
        if (rippleRadius > maxRippleRadius) {
          rippleActive = false;
        }
        // Draw subtle ripple outline
        ctx.strokeStyle = `rgba(255, 23, 68, ${Math.max(0, 0.12 - rippleRadius / maxRippleRadius)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rippleX, rippleY, rippleRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // A. Update and draw connection links in a single path batch (performance)
      ctx.beginPath();
      links.forEach(link => {
        const s = nodes[link.source];
        const t = nodes[link.target];
        if (!s || !t) return;

        // Apply Parallax offset based on node depth layer
        const sOffset = s.depth === 0 ? 0.35 : s.depth === 1 ? 0.75 : 1.25;
        const tOffset = t.depth === 0 ? 0.35 : t.depth === 1 ? 0.75 : 1.25;

        const sx = s.x + mouse.x * sOffset;
        const sy = s.y + mouse.y * sOffset;
        const tx = t.x + mouse.x * tOffset;
        const ty = t.y + mouse.y * tOffset;

        // Compute opacity based on link strength and global breathing phase
        const breathing = Math.sin(Date.now() / 2400) * 0.12 + 0.88;
        const excitementFactor = 1.0 + s.excitement * 1.5;
        let alpha = link.strength * 0.05 * breathing * excitementFactor;
        
        if (s.depth === 0) alpha *= 0.3;
        else if (s.depth === 2) alpha *= 1.4;

        ctx.moveTo(sx, sy);
        ctx.lineTo(tx, ty);
        
        // Highlight active connections in red
        if (isSimActive && (s.excitement > 0.5 || t.excitement > 0.5)) {
          ctx.strokeStyle = `rgba(255, 23, 68, ${alpha * 2.2})`;
        } else {
          ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        }
      });
      ctx.lineWidth = 0.55;
      ctx.stroke();

      // B. Update and draw nodes
      nodes.forEach(node => {
        // Organic drift movement
        node.x += node.vx * baseNodeSpeed;
        node.y += node.vy * baseNodeSpeed;

        // Boundary bounce check
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Calculate excitement decay
        if (node.excitement > 0) {
          node.excitement -= 0.015;
        }

        // Ripple wave node collision check
        if (rippleActive) {
          const dx = node.x - rippleX;
          const dy = node.y - rippleY;
          const dist = Math.sqrt(dx*dx + dy*dy);
          if (Math.abs(dist - rippleRadius) < 30) {
            node.excitement = 1.2; // Full excitement pulse
          }
        }

        // Parallax coordinates computation
        const offsetMultiplier = node.depth === 0 ? 0.35 : node.depth === 1 ? 0.75 : 1.25;
        const px = node.x + mouse.x * offsetMultiplier;
        const py = node.y + mouse.y * offsetMultiplier;

        // Pulse size calculations
        node.pulsePhase += 0.02;
        const breathingFactor = 1.0 + Math.sin(node.pulsePhase) * 0.12;
        const currentSize = node.size * breathingFactor * (1.0 + node.excitement * 0.8);

        // Node coloring
        let color = "rgba(255, 255, 255, 0.15)";
        if (node.depth === 0) color = "rgba(255, 255, 255, 0.06)";
        else if (node.depth === 2) color = "rgba(255, 255, 255, 0.28)";

        // Glowing threat nodes when excited
        if (node.excitement > 0.1) {
          const glowAlpha = Math.min(1.0, node.excitement);
          ctx.shadowBlur = 12;
          ctx.shadowColor = "rgba(255, 23, 68, 0.8)";
          ctx.fillStyle = `rgba(255, 23, 68, ${glowAlpha})`;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = color;
        }

        ctx.beginPath();
        ctx.arc(px, py, currentSize, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0; // reset

      // C. Update and draw animated packets
      packets.forEach(packet => {
        const s = nodes[packet.source];
        const t = nodes[packet.target];
        if (!s || !t) return;

        packet.progress += packet.speed * basePacketSpeed;
        
        // Reached target node, select new neighbor pathway
        if (packet.progress >= 1.0) {
          packet.progress = 0;
          packet.source = packet.target;
          
          const neighbors = getAdjacentNodes(packet.target);
          if (neighbors.length > 0) {
            packet.target = neighbors[Math.floor(Math.random() * neighbors.length)];
          }
          // Excite target node
          nodes[packet.source].excitement = Math.min(1.5, nodes[packet.source].excitement + 0.3);
        }

        // Draw packet at interpolated coordinate
        const sOffset = s.depth === 0 ? 0.35 : s.depth === 1 ? 0.75 : 1.25;
        const tOffset = t.depth === 0 ? 0.35 : t.depth === 1 ? 0.75 : 1.25;

        const sx = s.x + mouse.x * sOffset;
        const sy = s.y + mouse.y * sOffset;
        const tx = t.x + mouse.x * tOffset;
        const ty = t.y + mouse.y * tOffset;

        const px = sx + (tx - sx) * packet.progress;
        const py = sy + (ty - sy) * packet.progress;

        // Custom packet color adjustments based on excitement
        if (s.excitement > 0.5) {
          ctx.fillStyle = "rgba(255, 23, 68, 0.85)"; // bright red threat packets
          ctx.shadowColor = "#FF1744";
          ctx.shadowBlur = 6;
        } else {
          ctx.fillStyle = packet.color;
          ctx.shadowBlur = 0;
        }

        ctx.beginPath();
        ctx.arc(px, py, packet.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      animationId = requestAnimationFrame(tick);
    };

    tick();

    // Handle Resize observer
    const handleResize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
      
      // Update nodes positions to scale
      nodes.forEach(node => {
        node.x = Math.random() * width;
        node.y = Math.random() * height;
        node.baseX = node.x;
        node.baseY = node.y;
      });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(animationId);
      ctx.shadowBlur = 0;
    };
  }, [activeStage]);

  return (
    <canvas 
      ref={canvasRef} 
      className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-[#050505]"
    />
  );
}
export default NeuralBackground;
