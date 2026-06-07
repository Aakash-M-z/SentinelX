import { Link, useLocation } from "wouter";
import { Shield, Target, Activity, ShieldAlert, FileText, Network, AlertTriangle, MessageSquare, ShieldHalf } from "lucide-react";
import { cn } from "@/lib/utils";
import { useGetSimulationStatus, useListAlerts, useListIncidents } from "@workspace/api-client-react";

const navigation = [
  { name: "Command Center", href: "/", icon: Shield },
  { name: "Red Team", href: "/red-team", icon: Target },
  { name: "Attack Graph", href: "/attack-graph", icon: Activity },
  { name: "Blue Team", href: "/blue-team", icon: ShieldAlert },
  { name: "Commander", href: "/commander", icon: FileText },
  { name: "Cyber Range", href: "/cyber-range", icon: Network },
  { name: "Threat Intel", href: "/threat-intel", icon: AlertTriangle },
  { name: "Incidents", href: "/incidents", icon: ShieldHalf },
  { name: "Copilot", href: "/copilot", icon: MessageSquare },
];

export function Sidebar() {
  const [location] = useLocation();

  const { data: simulationStatus } = useGetSimulationStatus();
  const { data: alerts } = useListAlerts();
  const { data: incidents } = useListIncidents();

  const openAlertsCount = alerts?.filter(a => a.status === 'open').length || 0;
  const openIncidentsCount = incidents?.filter(i => i.status === 'open').length || 0;

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-16 items-center px-4 border-b border-sidebar-border">
        <Shield className="h-6 w-6 text-primary mr-2" />
        <span className="text-lg font-bold text-sidebar-foreground">SentinelX</span>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.name} href={item.href} className={cn(
                "group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md hover-elevate",
                isActive ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}>
                <div className="flex items-center">
                  <item.icon className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-primary"
                  )} aria-hidden="true" />
                  {item.name}
                </div>
                {item.name === "Blue Team" && openAlertsCount > 0 && (
                  <span className="bg-destructive text-destructive-foreground py-0.5 px-2 rounded-full text-xs">
                    {openAlertsCount}
                  </span>
                )}
                {item.name === "Incidents" && openIncidentsCount > 0 && (
                  <span className="bg-primary text-primary-foreground py-0.5 px-2 rounded-full text-xs">
                    {openIncidentsCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-sidebar-border">
        <div className="flex items-center">
          <div className={cn(
            "h-3 w-3 rounded-full mr-2",
            simulationStatus?.state === "running" ? "bg-primary animate-pulse" :
            simulationStatus?.state === "paused" ? "bg-warning" : "bg-muted"
          )} />
          <span className="text-sm font-medium capitalize text-sidebar-foreground">
            {simulationStatus?.state || "Unknown"}
          </span>
        </div>
      </div>
    </div>
  );
}
