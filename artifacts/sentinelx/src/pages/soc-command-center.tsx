import { useGetSimulationStatus, useStartSimulation, useStopSimulation, useResetSimulation, useGetSocSummary, useListSimulationEvents, useSendCopilotMessage, getGetSimulationStatusQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Square, RotateCcw, ShieldAlert, Activity, Crosshair, Terminal, Globe, Shield, Sparkles, Filter, Pause, PlayCircle, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// --- Types & Data Set ---
type CountryData = {
  name: string;
  lat: number;
  lon: number;
  score: number;
  active: number;
  blocked: number;
  cves: string[];
};

const COUNTRIES: CountryData[] = [
  { name: "United States", lat: 37.0902, lon: -95.7129, score: 78, active: 4, blocked: 142, cves: ["CVE-2023-38646", "CVE-2021-44228"] },
  { name: "United Kingdom", lat: 55.3781, lon: -3.4360, score: 42, active: 2, blocked: 98, cves: ["CVE-2021-4034"] },
  { name: "Germany", lat: 51.1657, lon: 10.4515, score: 35, active: 1, blocked: 120, cves: ["CVE-2023-38646"] },
  { name: "Japan", lat: 36.2048, lon: 138.2529, score: 55, active: 3, blocked: 85, cves: ["CVE-2021-44228"] },
  { name: "Australia", lat: -25.2744, lon: 133.7751, score: 18, active: 0, blocked: 42, cves: ["None"] },
  { name: "Brazil", lat: -14.2350, lon: -51.9253, score: 58, active: 3, blocked: 78, cves: ["CVE-2021-4034"] },
  { name: "Russia", lat: 61.5240, lon: 105.3188, score: 85, active: 7, blocked: 240, cves: ["CVE-2023-38646", "CVE-2021-4034"] },
  { name: "South Africa", lat: -30.5595, lon: 22.9375, score: 28, active: 1, blocked: 54, cves: ["None"] },
  { name: "India", lat: 20.5937, lon: 78.9629, score: 72, active: 5, blocked: 198, cves: ["CVE-2023-38646", "CVE-2021-44228"] },
  { name: "China", lat: 35.8617, lon: 104.1954, score: 88, active: 11, blocked: 350, cves: ["CVE-2023-38646", "CVE-2021-44228"] },
];

// 8 Stages of Simulation Attack Chain
const SIM_STAGES = [
  { 
    name: "Reconnaissance", 
    desc: "Target footprinting and DNS enumeration.",
    mitre: "TA0043 / Active Scanning", 
    risk: 12, 
    detection: 0,
    cve: "CVE-2023-38646",
    asset: "Internet Gateway",
    log: "EXTERNAL INGESTION: Query on DNS zone file triggered from IP 185.220.101.4."
  },
  { 
    name: "Scanning", 
    desc: "Nmap port sweep on external subnets.",
    mitre: "T1046 / Network Service Discovery", 
    risk: 25, 
    detection: 12,
    cve: "None",
    asset: "Firewall",
    log: "PORT SCAN: Multiple connection attempts detected on TCP ports 22, 80, 443, 8080."
  },
  { 
    name: "Vulnerability Discovery", 
    desc: "Identification of outdated web server frameworks.",
    mitre: "T1595 / Vulnerability Scanning", 
    risk: 38, 
    detection: 25,
    cve: "CVE-2021-44228",
    asset: "Web Server",
    log: "VULN AUDIT: Remote service check targeting Log4j vulnerabilities on Web App."
  },
  { 
    name: "Exploitation", 
    desc: "Remote Code Execution payload delivery.",
    mitre: "T1210 / Exploitation of Remote Services", 
    risk: 54, 
    detection: 48,
    cve: "CVE-2021-44228",
    asset: "Web Server",
    log: "EXPLOIT PAYLOAD: Successful remote command execution on Web Server. Shell opened."
  },
  { 
    name: "Privilege Escalation", 
    desc: "Root level access validation via kernel exploits.",
    mitre: "T1068 / Exploitation for Privilege Escalation", 
    risk: 68, 
    detection: 62,
    cve: "CVE-2021-4034",
    asset: "Web Server",
    log: "PRIVILEGE ESCALATION: Polkit pkexec local exploit executed successfully. Root shell active."
  },
  { 
    name: "Lateral Movement", 
    desc: "Credential harvesting and internal network routing.",
    mitre: "T1021 / Remote Services", 
    risk: 80, 
    detection: 75,
    cve: "None",
    asset: "Database Server",
    log: "LATERAL ROUTING: SSH authentication attempt from Web Server to Database Server."
  },
  { 
    name: "Persistence", 
    desc: "Cron jobs and backdoor service registration.",
    mitre: "T1053 / Scheduled Task/Job", 
    risk: 92, 
    detection: 86,
    cve: "None",
    asset: "Domain Controller",
    log: "PERSISTENCE ESTABLISHED: Systemd service 'sentinel_daemon' registered on Domain Controller."
  },
  { 
    name: "Data Exfiltration", 
    desc: "Outbound encrypted staging of database records.",
    mitre: "T1048 / Exfiltration Over Alternative Protocol", 
    risk: 98, 
    detection: 95,
    cve: "None",
    asset: "Database Server",
    log: "DATA LEAK: Compressed database archive exfiltrated via DNS tunneling to external collector."
  }
];

// Dynamic Web Audio alert chime synthesizer
function playChime(level: "critical" | "medium" | "success" | "boot") {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    if (level === "boot") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(150, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 1.4);
      
      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.linearRampToValueAtTime(0.12, audioCtx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.4);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.4);
    } else if (level === "critical") {
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      
      osc1.type = "sawtooth";
      osc2.type = "sine";
      osc1.frequency.setValueAtTime(520, audioCtx.currentTime);
      osc2.frequency.setValueAtTime(523.25, audioCtx.currentTime);
      osc1.frequency.setValueAtTime(620, audioCtx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.5);
      osc2.stop(audioCtx.currentTime + 0.5);
    } else if (level === "success") {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, audioCtx.currentTime + 0.2); // G5
      
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.5);
    } else {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.25);
      
      gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
      
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    }
  } catch (err) {
    console.warn("WebGL Audio context failed to load:", err);
  }
}

// Cinematic Boot sequence modal
function CinematicBoot({ onComplete }: { onComplete: () => void }) {
  const [logs, setLogs] = useState<string[]>([]);
  const [percent, setPercent] = useState(0);

  const lines = [
    "INITIALIZING SENTINELX CYBER SIMULATION...",
    "Mounting Threat Intelligence Databases...",
    "Connecting API Endpoints & Security Nodes...",
    "Initializing MITRE ATT&CK Mapping Grid...",
    "Connecting AI Copilot Analytics Models...",
    "CYBER RANGE SIMULATION INGEST READY // GO"
  ];

  useEffect(() => {
    playChime("boot");
    
    lines.forEach((line, i) => {
      setTimeout(() => {
        setLogs(prev => [...prev, line]);
      }, i * 350);
    });

    const timer = setInterval(() => {
      setPercent(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 400);
          return 100;
        }
        return prev + 4;
      });
    }, 70);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-[9999] p-6">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,23,68,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,23,68,0.015)_1px,transparent_1px)] bg-[size:30px_30px]" />
      
      <div className="relative w-full max-w-lg bg-[#0F0F14]/95 border border-[#FF1744]/20 rounded-xl p-6 shadow-[0_0_50px_rgba(255,23,68,0.15)] backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4 border-b border-slate-900 pb-3 font-mono text-xs text-muted-foreground uppercase">
          <Terminal className="w-4 h-4 text-primary animate-pulse" />
          <span>Simulation Boot Sequencer</span>
          <span className="ml-auto w-2 h-2 rounded-full bg-primary animate-ping" />
        </div>

        <div className="space-y-4">
          <div className="h-32 bg-[#060608] border border-slate-900 rounded p-3 font-mono text-[11px] text-slate-300 space-y-1 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className={i === 0 ? "text-primary font-bold" : ""}>
                &gt; {log}
              </div>
            ))}
          </div>

          <div className="space-y-1.5 font-mono text-[9px] text-muted-foreground">
            <div className="flex justify-between">
              <span>SYSTEMS INTEGRATION</span>
              <span>{percent}%</span>
            </div>
            <div className="h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-850">
              <div className="h-full bg-primary transition-all duration-100" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Sparklines chart helper
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const width = 100;
  const height = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((val - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={points}
        className="drop-shadow-[0_0_4px_rgba(255,23,68,0.2)]"
      />
    </svg>
  );
}

// THREE GLOBE COMPONENT WITH INERTIA ROTATION, RAYCAST INTERACTION & MOUSE HOVER
interface ThreeGlobeProps {
  activeStage: number;
  severityFilter: string;
  typeFilter: string;
  isPaused: boolean;
  onCountryClick: (country: CountryData) => void;
  onHover: (country: (CountryData & { screenX: number; screenY: number }) | null) => void;
}

function ThreeGlobe({ activeStage, severityFilter, typeFilter, isPaused, onCountryClick, onHover }: ThreeGlobeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef(new THREE.Vector2());
  const isDragging = useRef(false);
  const previousMousePosition = useRef({ x: 0, y: 0 });
  const idleTimeRef = useRef(0);
  
  // Inertia velocities
  const velX = useRef(0);
  const velY = useRef(0);
  
  // Easing zoom scale values
  const targetScale = useRef(1.0);
  const currentScale = useRef(1.0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    const w = container.clientWidth || 500;
    const h = container.clientHeight || 380;

    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.z = 220;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setSize(w, h);
    container.appendChild(renderer.domElement);

    // Create Earth Wireframe Globe
    const geometry = new THREE.SphereGeometry(65, 24, 24);
    const globeMaterial = new THREE.MeshBasicMaterial({
      color: 0xFF1744,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const globe = new THREE.Mesh(geometry, globeMaterial);
    scene.add(globe);

    // Inner wireframe sphere
    const innerGeom = new THREE.SphereGeometry(64.5, 12, 12);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0xFF1744,
      wireframe: true,
      transparent: true,
      opacity: 0.03,
    });
    const innerGlobe = new THREE.Mesh(innerGeom, innerMat);
    globe.add(innerGlobe);

    // Add HUD Equator Ring
    const ringGeom = new THREE.RingGeometry(75, 76, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xFF1744,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.05,
    });
    const ring = new THREE.Mesh(ringGeom, ringMat);
    ring.rotation.x = Math.PI / 2;
    globe.add(ring);

    // Coordinates mapping helper
    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      const x = -(radius * Math.sin(phi) * Math.sin(theta));
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);
      return new THREE.Vector3(x, y, z);
    };

    // Add sensor node markers
    const sensorsGroup = new THREE.Group();
    globe.add(sensorsGroup);

    const sensorMaterial = new THREE.MeshBasicMaterial({ color: 0xFF1744 });
    const sensorGeom = new THREE.SphereGeometry(1.5, 8, 8);

    COUNTRIES.forEach(c => {
      const pos = latLonToVector3(c.lat, c.lon, 65);
      const mesh = new THREE.Mesh(sensorGeom, sensorMaterial);
      mesh.position.copy(pos);
      sensorsGroup.add(mesh);
    });

    // Threat arcs group
    const arcsGroup = new THREE.Group();
    globe.add(arcsGroup);

    const drawCurve = (v1: THREE.Vector3, v2: THREE.Vector3) => {
      const distance = v1.distanceTo(v2);
      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
      const normal = mid.clone().normalize();
      
      const control = mid.clone().add(normal.multiplyScalar(distance * 0.35));
      const curve = new THREE.QuadraticBezierCurve3(v1, control, v2);
      const points = curve.getPoints(32);
      const curveGeom = new THREE.BufferGeometry().setFromPoints(points);

      const curveMat = new THREE.LineBasicMaterial({
        color: 0xFF1744,
        transparent: true,
        opacity: 0.55,
      });

      const line = new THREE.Line(curveGeom, curveMat);
      arcsGroup.add(line);

      const packetGeom = new THREE.SphereGeometry(0.8, 6, 6);
      const packetMat = new THREE.MeshBasicMaterial({ color: 0xFF4569 });
      const packet = new THREE.Mesh(packetGeom, packetMat);
      arcsGroup.add(packet);

      let tVal = 0;
      const animateTick = () => {
        if (isPaused) return;
        tVal += 0.012;
        if (tVal > 1) tVal = 0;
        const p = curve.getPointAt(tVal);
        packet.position.copy(p);
      };

      return animateTick;
    };

    let activeAnimates: (() => void)[] = [];

    // Trigger threat arcs based on filter configurations
    const triggerArcs = () => {
      while (arcsGroup.children.length > 0) {
        arcsGroup.remove(arcsGroup.children[0]);
      }
      activeAnimates = [];

      // Determine active arc counts based on active stage
      const numArcs = activeStage >= 0 ? Math.min(8, activeStage + 2) : 2;
      
      // Filter severity criteria
      if (severityFilter === "low" || severityFilter === "medium" && activeStage < 2) return;
      if (typeFilter === "ddos" && activeStage < 1) return;

      for (let i = 0; i < numArcs; i++) {
        const c1 = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
        let c2 = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
        while (c1 === c2) {
          c2 = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
        }
        const v1 = latLonToVector3(c1.lat, c1.lon, 65);
        const v2 = latLonToVector3(c2.lat, c2.lon, 65);
        
        const tick = drawCurve(v1, v2);
        activeAnimates.push(tick);
      }
    };

    triggerArcs();

    // Raycasting picking setup
    const raycaster = new THREE.Raycaster();
    
    // Rotation local trackers
    let rotationY = globe.rotation.y;
    let rotationX = globe.rotation.x;

    // Animation Loop
    let animationId: number;
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      // Easing Zoom scale
      currentScale.current += (targetScale.current - currentScale.current) * 0.1;
      globe.scale.set(currentScale.current, currentScale.current, currentScale.current);

      // Rotation Inertia Deceleration
      if (isDragging.current) {
        rotationY += velY.current;
        rotationX += velX.current;
        idleTimeRef.current = 0;
      } else {
        rotationY += velY.current;
        rotationX += velX.current;
        velY.current *= 0.92; // friction
        velX.current *= 0.92;

        // Auto-rotation when idle
        idleTimeRef.current += 16;
        if (idleTimeRef.current > 5000 && !isPaused) {
          rotationY += 0.002;
        }
      }

      globe.rotation.y = rotationY;
      globe.rotation.x = Math.max(-Math.PI / 2.5, Math.min(Math.PI / 2.5, rotationX));

      // Raycast hover checks
      raycaster.setFromCamera(mouseRef.current, camera);
      const intersects = raycaster.intersectObject(globe);
      
      if (intersects.length > 0) {
        const intersectPoint = intersects[0].point;
        // World coordinates to local coordinates
        const localPoint = globe.worldToLocal(intersectPoint.clone());
        const radius = 65;
        const lat = Math.asin(Math.max(-1, Math.min(1, localPoint.y / radius))) * (180 / Math.PI);
        const lon = Math.atan2(localPoint.x, localPoint.z) * (180 / Math.PI);

        let closest: CountryData | null = null;
        let minDist = Infinity;

        COUNTRIES.forEach(c => {
          const dLat = c.lat - lat;
          const dLon = c.lon - lon;
          const dist = dLat*dLat + dLon*dLon;
          if (dist < minDist) {
            minDist = dist;
            closest = c;
          }
        });

        // Hover distance threshold check
        if (minDist < 550 && closest) {
          // Calculate mouse screen positions
          const rect = renderer.domElement.getBoundingClientRect();
          const screenX = rect.left + ((mouseRef.current.x + 1) / 2) * rect.width;
          const screenY = rect.top + (-(mouseRef.current.y - 1) / 2) * rect.height;
          
          onHover({
            ...(closest as CountryData),
            screenX,
            screenY,
          });
        } else {
          onHover(null);
        }
      } else {
        onHover(null);
      }

      activeAnimates.forEach(fn => fn());
      renderer.render(scene, camera);
    };
    animate();

    // Event Handlers
    const handleMouseMove = (event: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (!isDragging.current) return;
      const deltaX = event.clientX - previousMousePosition.current.x;
      const deltaY = event.clientY - previousMousePosition.current.y;

      velY.current = deltaX * 0.005;
      velX.current = deltaY * 0.005;

      previousMousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseDown = (event: MouseEvent) => {
      isDragging.current = true;
      previousMousePosition.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      targetScale.current = Math.max(0.6, Math.min(2.2, targetScale.current + event.deltaY * -0.001));
    };

    const handleClick = () => {
      raycaster.setFromCamera(mouseRef.current, camera);
      const intersects = raycaster.intersectObject(globe);
      if (intersects.length > 0) {
        const intersectPoint = intersects[0].point;
        const localPoint = globe.worldToLocal(intersectPoint.clone());
        const radius = 65;
        const lat = Math.asin(Math.max(-1, Math.min(1, localPoint.y / radius))) * (180 / Math.PI);
        const lon = Math.atan2(localPoint.x, localPoint.z) * (180 / Math.PI);

        let closest: CountryData | null = null;
        let minDist = Infinity;
        COUNTRIES.forEach(c => {
          const dLat = c.lat - lat;
          const dLon = c.lon - lon;
          const dist = dLat*dLat + dLon*dLon;
          if (dist < minDist) {
            minDist = dist;
            closest = c;
          }
        });

        if (minDist < 550 && closest) {
          onCountryClick(closest);
        }
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener("mousemove", handleMouseMove);
    dom.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mouseup", handleMouseUp);
    dom.addEventListener("wheel", handleWheel, { passive: false });
    dom.addEventListener("click", handleClick);

    const handleResize = () => {
      const wWidth = container.clientWidth;
      const wHeight = container.clientHeight;
      camera.aspect = wWidth / wHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(wWidth, wHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      dom.removeEventListener("mousemove", handleMouseMove);
      dom.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mouseup", handleMouseUp);
      dom.removeEventListener("wheel", handleWheel);
      dom.removeEventListener("click", handleClick);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationId);
      container.removeChild(dom);
      renderer.dispose();
    };
  }, [activeStage, severityFilter, typeFilter, isPaused]);

  return (
    <div className="relative w-full h-full min-h-[380px] flex items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_center,rgba(255,23,68,0.015)_0%,transparent_70%)]">
      <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
      
      {/* Outer hud ticks overlay */}
      <div className="absolute inset-0 border border-dashed border-primary/10 rounded-full scale-[0.8] animate-[spin_60s_linear_infinite] pointer-events-none" />
      
      {/* HUD Telemetry text */}
      <div className="absolute top-4 left-4 font-mono text-[9px] text-[#FF1744]/70 space-y-1 bg-[#050505]/85 p-2.5 rounded border border-[#FF1744]/20 backdrop-blur-md">
        <div>ORBIT: GEOSYNCHRONOUS LEO</div>
        <div>SYS: DEPLOYED SENSORS [8/8]</div>
        <div>TEL: ACTIVE THREAT VECTORS</div>
      </div>
      <div className="absolute bottom-4 right-4 font-mono text-[9px] text-[#FF1744]/55 pointer-events-none">
        THREE.JS RENDER // SECURE LINK
      </div>
    </div>
  );
}

export default function SocCommandCenter() {
  const queryClient = useQueryClient();
  const { data: simulationStatus } = useGetSimulationStatus({ query: { refetchInterval: 3000 } as any });
  const { data: socSummary } = useGetSocSummary();
  const { data: events } = useListSimulationEvents();
  
  const startSim = useStartSimulation();
  const stopSim = useStopSimulation();
  const resetSim = useResetSimulation();
  const sendCopilot = useSendCopilotMessage();

  // Playback states
  const [activeStage, setActiveStage] = useState<number>(-1);
  const [isBooting, setIsBooting] = useState(false);
  const [isSimRunning, setIsSimRunning] = useState(false);
  const [localEvents, setLocalEvents] = useState<any[]>([]);

  // Filter settings
  const [severityFilter, setSeverityFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [isStreamPaused, setIsStreamPaused] = useState(false);

  // Hovered country tooltips
  const [hoveredCountry, setHoveredCountry] = useState<(CountryData & { screenX: number; screenY: number }) | null>(null);
  
  // Selected country details drawer
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);

  // Sync simulation status on mount
  useEffect(() => {
    const stageVal = localStorage.getItem("sentinelx_sim_stage");
    if (stageVal !== null) {
      const idx = parseInt(stageVal);
      setActiveStage(idx);
      setIsSimRunning(idx >= 0);
    }
  }, []);

  // Playback progression timer loop
  useEffect(() => {
    if (!isSimRunning || activeStage >= 7 || isStreamPaused) return;

    const interval = setInterval(() => {
      setActiveStage(prev => {
        const next = prev + 1;
        localStorage.setItem("sentinelx_sim_stage", String(next));
        
        // Trigger alert beep chime
        playChime("critical");

        // Build simulated log event
        const stageInfo = SIM_STAGES[next];
        const newLog = {
          id: Math.random().toString(),
          timestamp: new Date().toISOString(),
          type: "attack",
          description: stageInfo.log,
          actor: "red_team",
          severity: next > 4 ? "critical" : next > 2 ? "high" : "medium",
        };
        
        setLocalEvents(prevLogs => [newLog, ...prevLogs]);

        // Trigger AI Copilot automatic analysis in background
        sendCopilot.mutate({
          data: {
            message: `Analyze active threat vectors: Simulation reached '${stageInfo.name}' stage targeting '${stageInfo.asset}'. MITRE technique: ${stageInfo.mitre}. Analyze impact, cvss risk exposure, and explain mitigation guidelines.`,
            context: "incident"
          }
        });

        if (next >= 7) {
          clearInterval(interval);
        }
        return next;
      });
    }, 6500);

    return () => clearInterval(interval);
  }, [isSimRunning, activeStage, isStreamPaused]);

  const handleStartSim = () => {
    setIsBooting(true);
  };

  const handleBootComplete = () => {
    setIsBooting(false);
    setIsSimRunning(true);
    setActiveStage(0);
    localStorage.setItem("sentinelx_sim_stage", "0");
    playChime("success");

    // Add first event log
    const stageInfo = SIM_STAGES[0];
    const firstLog = {
      id: Math.random().toString(),
      timestamp: new Date().toISOString(),
      type: "attack",
      description: stageInfo.log,
      actor: "red_team",
      severity: "medium",
    };
    setLocalEvents([firstLog]);

    // Send copilot trigger
    sendCopilot.mutate({
      data: {
        message: `Analyze threat vector: Simulation reached '${stageInfo.name}' phase targeting '${stageInfo.asset}'. MITRE: ${stageInfo.mitre}. Discuss vulnerabilities.`,
        context: "incident"
      }
    });

    startSim.mutate({ data: { scenario: "apt_attack", difficulty: "medium" } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSimulationStatusQueryKey() })
    });
  };

  const handleStopSim = () => {
    setIsSimRunning(false);
    setActiveStage(-1);
    localStorage.removeItem("sentinelx_sim_stage");
    playChime("medium");

    stopSim.mutate(undefined, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSimulationStatusQueryKey() })
    });
  };

  const handleResetSim = () => {
    setIsSimRunning(false);
    setActiveStage(-1);
    localStorage.removeItem("sentinelx_sim_stage");
    setLocalEvents([]);
    playChime("medium");

    resetSim.mutate(undefined, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetSimulationStatusQueryKey() })
    });
  };

  // Compile combined event list
  const allEvents = [...localEvents, ...(events ?? [])];
  
  // Filter events based on active configurations
  const filteredEvents = allEvents.filter(ev => {
    if (severityFilter !== "all" && ev.severity !== severityFilter) return false;
    if (typeFilter !== "all" && ev.type !== typeFilter) return false;
    return true;
  });

  // Calculate dynamic metrics based on active stage
  const currentRisk = activeStage >= 0 ? SIM_STAGES[activeStage].risk : (socSummary?.riskScore || 0);
  const currentDetection = activeStage >= 0 ? SIM_STAGES[activeStage].detection : (socSummary?.detectionRate !== undefined ? Number(socSummary.detectionRate) : 0);
  const activeIncidents = activeStage >= 0 ? (activeStage + 1) : (socSummary?.activeIncidents || 0);

  return (
    <div className="p-6 space-y-6 bg-transparent">
      {/* Boot Sequencer Overlay */}
      {isBooting && <CinematicBoot onComplete={handleBootComplete} />}

      {/* Country Tooltip portal */}
      {hoveredCountry && (
        <div 
          className="absolute z-[9999] pointer-events-none p-3.5 bg-[#0F0F14]/90 border border-primary/20 rounded-xl shadow-[0_0_20px_rgba(255,23,68,0.12)] font-mono text-[10px] space-y-1.5 backdrop-blur-md"
          style={{ left: `${hoveredCountry.screenX + 15}px`, top: `${hoveredCountry.screenY - 30}px` }}
        >
          <div className="font-bold text-glow text-primary uppercase border-b border-slate-900 pb-1 mb-1">{hoveredCountry.name}</div>
          <div className="flex justify-between gap-6"><span className="text-slate-500">THREAT SCORE:</span><span className="text-primary font-bold">{hoveredCountry.score}/100</span></div>
          <div className="flex justify-between gap-6"><span className="text-slate-500">ACTIVE EVENTS:</span><span className="text-slate-200">{hoveredCountry.active}</span></div>
          <div className="flex justify-between gap-6"><span className="text-slate-500">BLOCKED INTRUSIONS:</span><span className="text-emerald-500">{hoveredCountry.blocked}</span></div>
          <div className="flex justify-between gap-6"><span className="text-slate-500">TOP CVES:</span><span className="text-slate-300">{hoveredCountry.cves.join(", ")}</span></div>
        </div>
      )}

      {/* Threat intelligence slide drawer */}
      <AnimatePresence>
        {selectedCountry && (
          <motion.div 
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 bottom-0 z-[999] w-96 bg-[#0F0F14]/95 border-l border-primary/20 p-6 shadow-[-10px_0_40px_rgba(0,0,0,0.8)] backdrop-blur-lg flex flex-col justify-between"
          >
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b border-slate-900 pb-4">
                <div>
                  <Badge variant="destructive" className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5">APT REGIONAL DOSSIER</Badge>
                  <h2 className="text-xl font-bold font-mono tracking-wider mt-1 text-primary">{selectedCountry.name}</h2>
                </div>
                <button 
                  onClick={() => setSelectedCountry(null)}
                  className="p-1 rounded bg-slate-950 border border-slate-800 hover:border-primary/40 text-slate-400 hover:text-primary transition-all"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4 font-mono text-xs">
                <div className="space-y-1.5">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Regional Threat Rating</span>
                  <div className="flex items-center gap-3 bg-black/40 border border-slate-900 p-2.5 rounded-lg">
                    <div className="text-lg font-bold text-primary">{selectedCountry.score}/100</div>
                    <div className="h-1.5 flex-1 bg-slate-900 rounded-full overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${selectedCountry.score}%` }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="bg-black/40 border border-slate-900 p-2.5 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase block mb-1">Active Alerts</span>
                    <span className="text-xs text-primary font-bold">{selectedCountry.active} Attacks</span>
                  </div>
                  <div className="bg-black/40 border border-slate-900 p-2.5 rounded-lg">
                    <span className="text-[9px] text-slate-500 uppercase block mb-1">Blocked Attacks</span>
                    <span className="text-xs text-emerald-500 font-bold">{selectedCountry.blocked} blocked</span>
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-900 pt-4">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Top CVE Vulnerabilities</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCountry.cves.map(c => (
                      <Badge key={c} variant="outline" className="border-primary/20 text-primary text-[9px] font-mono capitalize">
                        {c}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 border-t border-slate-900 pt-4">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Remediation actions</span>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
                    Restricting perimeter subnets mapping to regional ranges. Monitor active port scanning spikes and restrict firewall route ingress parameters.
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-900 pt-4 font-mono text-[9px] text-slate-500 uppercase flex items-center justify-between">
              <span>SYNC STATE: SYNCHRONIZED</span>
              <span>SENTINELX CORE</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dashboard Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-900 pb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-glow flex items-center gap-2">
            <Shield className="text-primary w-8 h-8" />
            SOC OPERATIONS CENTRE
          </h1>
          <p className="text-sm text-slate-400 mt-1 font-mono uppercase tracking-wider">
            TACTICAL CYBER RANGE HUD // SIMULATION STATE:{" "}
            <span className={isSimRunning ? "text-primary text-glow font-bold" : "text-slate-500"}>
              {isSimRunning ? `RUNNING - STAGE: ${SIM_STAGES[activeStage]?.name.toUpperCase()}` : "IDLE"}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {!isSimRunning ? (
            <Button onClick={handleStartSim} className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-[0_0_15px_rgba(255,23,68,0.3)] transition-all font-mono font-bold" data-testid="btn-start-sim">
              <Play className="mr-2 h-4 w-4 fill-current" /> START SIMULATION
            </Button>
          ) : (
            <Button onClick={handleStopSim} variant="destructive" className="hover:shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-all font-mono font-bold" data-testid="btn-stop-sim">
              <Square className="mr-2 h-4 w-4 fill-current" /> STOP SIMULATION
            </Button>
          )}
          <Button onClick={handleResetSim} variant="outline" className="border-slate-800 text-slate-300 hover:bg-secondary/40 font-mono" data-testid="btn-reset-sim">
            <RotateCcw className="mr-2 h-4 w-4" /> RESET RANGE
          </Button>
        </div>
      </div>

      {/* Live attack lifecycle tracker */}
      {isSimRunning && (
        <Card className="glass-panel border-primary/20 bg-primary/[0.01] p-4 flex flex-col gap-3 font-mono">
          <div className="flex justify-between items-center text-[10px] text-primary font-bold uppercase tracking-widest">
            <span>Simulation Vector Playback</span>
            <span>{activeStage + 1} of 8 stages completed</span>
          </div>
          
          <div className="grid grid-cols-8 gap-2">
            {SIM_STAGES.map((stage, idx) => {
              const isPast = idx < activeStage;
              const isCurrent = idx === activeStage;
              
              let barColor = "bg-slate-900 border-slate-800";
              let textColor = "text-slate-500";
              if (isPast) {
                barColor = "bg-primary/40 border-primary/20";
                textColor = "text-primary/70";
              } else if (isCurrent) {
                barColor = "bg-primary border-primary animate-pulse";
                textColor = "text-primary text-glow font-bold";
              }

              return (
                <div key={idx} className="flex flex-col gap-1 text-center">
                  <div className={`h-1.5 rounded-full border ${barColor}`} />
                  <span className={`text-[8px] truncate hidden md:block ${textColor}`}>{stage.name}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* MAIN 3-COLUMN COMMAND CENTER LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COLUMN: Live Threat Feed (3/12 width) */}
        <Card className="glass-panel lg:col-span-3 flex flex-col h-[520px] overflow-hidden border-slate-900">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-row items-center justify-between">
            <CardTitle className="font-mono text-xs font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-primary" /> LIVE THREAT FEED
            </CardTitle>
            
            {/* Stream playback controller */}
            {isSimRunning && (
              <button 
                onClick={() => setIsStreamPaused(!isStreamPaused)}
                className="text-slate-400 hover:text-primary transition-all p-1"
                title={isStreamPaused ? "Resume Ingest" : "Pause Ingest"}
              >
                {isStreamPaused ? <PlayCircle size={14} /> : <Pause size={14} />}
              </button>
            )}
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto p-3 font-mono text-[10px] space-y-2.5 bg-black/15 scrollbar-thin">
            <AnimatePresence>
              {filteredEvents.length > 0 ? (
                filteredEvents.slice(0, 15).map((event) => {
                  const isAttack = event.type === "attack" || event.actor === "red_team";
                  const badgeColor = isAttack ? "text-primary text-glow font-bold" : "text-green-400";
                  
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="p-2.5 rounded bg-slate-950/70 border border-slate-900/90 flex flex-col gap-1 hover:border-primary/20 transition-all cursor-pointer"
                    >
                      <div className="flex justify-between items-center text-[9px]">
                        <span className="text-slate-500">[{new Date(event.timestamp).toLocaleTimeString()}]</span>
                        <span className={`uppercase font-bold tracking-widest ${badgeColor}`}>
                          {event.type}
                        </span>
                      </div>
                      <div className="text-slate-300 leading-relaxed font-sans mt-0.5">{event.description}</div>
                      <div className="text-[9px] text-slate-500 uppercase tracking-wider flex justify-between items-center mt-1 border-t border-slate-900/40 pt-1">
                        <span>Source: {event.actor}</span>
                        <span>Severity: {event.severity}</span>
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-center text-slate-600 font-mono text-[10px] p-6">
                  NO ACTIVE LOGS INGESTED ON FILTER SELECTION.
                </div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* CENTER COLUMN: Interactive Three.js Globe (6/12 width) */}
        <Card className="glass-panel lg:col-span-6 flex flex-col h-[520px] relative overflow-hidden border-slate-900 bg-[#050505]/40">
          <CardHeader className="pb-3 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="font-mono text-xs font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-primary animate-pulse" /> GLOBAL THREAT INTELLIGENCE
            </CardTitle>
            
            {/* Filter controls */}
            <div className="flex gap-2">
              <div className="relative">
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="bg-[#0F0F14] border border-slate-800 text-[9px] text-primary font-mono rounded px-2 py-1 focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="all">ALL SEVERITY</option>
                  <option value="critical">CRITICAL</option>
                  <option value="high">HIGH</option>
                  <option value="medium">MEDIUM</option>
                </select>
              </div>
              <div className="relative">
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="bg-[#0F0F14] border border-slate-800 text-[9px] text-primary font-mono rounded px-2 py-1 focus:border-primary focus:outline-none cursor-pointer"
                >
                  <option value="all">ALL TYPES</option>
                  <option value="attack">ATTACKS</option>
                  <option value="mitigation">MITIGATIONS</option>
                </select>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 flex items-center justify-center bg-[#050505]/20">
            <ThreeGlobe 
              activeStage={activeStage} 
              severityFilter={severityFilter}
              typeFilter={typeFilter}
              isPaused={isStreamPaused}
              onCountryClick={(c) => setSelectedCountry(c)}
              onHover={(c) => setHoveredCountry(c)}
            />
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: AI Threat Analysis briefing (3/12 width) */}
        <Card className="glass-panel lg:col-span-3 flex flex-col h-[520px] overflow-hidden border-slate-900">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="font-mono text-xs font-bold tracking-widest text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" /> REAL-TIME COGNITIVE briefing
            </CardTitle>
          </CardHeader>
          
          <CardContent className="flex-1 p-4 font-mono text-[10px] space-y-4 bg-black/15 overflow-y-auto scrollbar-thin">
            {activeStage >= 0 ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Active Threat Vector</span>
                  <div className="text-xs font-bold text-glow text-primary uppercase">{SIM_STAGES[activeStage].name}</div>
                </div>

                <div className="space-y-1 border-t border-slate-900 pt-3">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block">MITRE Reference</span>
                  <div className="text-slate-300">{SIM_STAGES[activeStage].mitre}</div>
                </div>

                <div className="space-y-1 border-t border-slate-900 pt-3">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Asset Vulnerability</span>
                  <div className="text-slate-300">Targeting {SIM_STAGES[activeStage].asset} ({SIM_STAGES[activeStage].cve})</div>
                </div>

                <div className="space-y-1 border-t border-slate-900 pt-3">
                  <span className="text-[9px] text-slate-500 uppercase tracking-widest block">Analysis Payload Description</span>
                  <p className="text-slate-400 font-sans leading-relaxed text-[11px]">{SIM_STAGES[activeStage].desc}</p>
                </div>

                <div className="space-y-2 border-t border-slate-900 pt-3 bg-primary/[0.01] p-2 rounded border border-primary/10">
                  <span className="text-[9px] text-primary font-bold uppercase tracking-widest block">Mitigation Guidance</span>
                  <p className="text-[10px] text-slate-300 leading-normal font-sans">
                    Monitor intrusion metrics for {SIM_STAGES[activeStage].asset}. Restrict remote connection parameters and check for active payloads.
                  </p>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-600 gap-2">
                <AlertCircle className="w-8 h-8 text-slate-700" />
                <span>AI ANALYSIS OFFLINE.<br/>START THE SIMULATION TO BEGIN telemetry INGESTION.</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM ROW: Security Metrics Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="glass-panel relative overflow-hidden group border-slate-900">
          <div className="absolute top-0 left-0 w-[2px] h-full bg-[#FF1744] opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">Active Incidents</span>
            <ShieldAlert className="h-4 w-4 text-primary animate-pulse" />
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="space-y-1">
              <div className="text-3xl font-extrabold tracking-tight text-glow text-primary">
                {activeIncidents}
              </div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">CRITICAL STATUS</div>
            </div>
            <Sparkline data={isSimRunning ? [1, 2, 3, 4, 5, activeIncidents] : [0, 0, 0, 0]} color="#FF1744" />
          </CardContent>
        </Card>

        <Card className="glass-panel relative overflow-hidden group border-slate-900">
          <div className="absolute top-0 left-0 w-[2px] h-full bg-amber-500 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">Risk Level Score</span>
            <Activity className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="space-y-1">
              <div className="text-3xl font-extrabold tracking-tight text-amber-500">
                {currentRisk}/100
              </div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">THREAT EXPOSURE</div>
            </div>
            <Sparkline data={isSimRunning ? [10, 20, 30, 45, 60, currentRisk] : [0, 0, 0, 0]} color="#f59e0b" />
          </CardContent>
        </Card>

        <Card className="glass-panel relative overflow-hidden group border-slate-900">
          <div className="absolute top-0 left-0 w-[2px] h-full bg-green-500 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">Detection Rate</span>
            <Crosshair className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="space-y-1">
              <div className="text-3xl font-extrabold tracking-tight text-green-400">
                {currentDetection.toFixed(0)}%
              </div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">CONTAINMENT RATIO</div>
            </div>
            <Sparkline data={isSimRunning ? [0, 10, 25, 40, 60, currentDetection] : [0, 0, 0, 0]} color="#22c55e" />
          </CardContent>
        </Card>

        <Card className="glass-panel relative overflow-hidden group border-slate-900">
          <div className="absolute top-0 left-0 w-[2px] h-full bg-slate-500 opacity-50" />
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <span className="text-xs font-mono tracking-widest text-slate-400 uppercase">Mean Time to Detect</span>
            <Activity className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent className="flex items-end justify-between">
            <div className="space-y-1">
              <div className="text-3xl font-extrabold tracking-tight text-slate-300">
                {activeStage >= 0 ? `${(6.5 * (activeStage + 1)).toFixed(0)}s` : "0s"}
              </div>
              <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">DEFENSIVE LATENCY</div>
            </div>
            <Sparkline data={[6.5, 5.8, 5.0, 4.5, 4.2]} color="#94a3b8" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
