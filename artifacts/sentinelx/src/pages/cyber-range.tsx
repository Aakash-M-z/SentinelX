import { useGetNetworkTopology, useListAssets, useGetAsset, useUpdateAssetCompromise, getListAssetsQueryKey, getGetNetworkTopologyQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Server, Database, Router, Monitor } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function CyberRange() {
  const { data: topology } = useGetNetworkTopology();
  const { data: assets } = useListAssets();
  const [selectedAssetId, setSelectedAssetId] = useState<number | null>(null);
  
  const { data: selectedAsset } = useGetAsset(selectedAssetId!, {
    query: { enabled: !!selectedAssetId, queryKey: ['asset', selectedAssetId] }
  });

  const getIcon = (type: string) => {
    switch(type) {
      case 'database': return <Database className="w-6 h-6" />;
      case 'router': return <Router className="w-6 h-6" />;
      case 'workstation': return <Monitor className="w-6 h-6" />;
      default: return <Server className="w-6 h-6" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'compromised': return 'text-destructive border-destructive';
      case 'targeted': return 'text-warning border-warning';
      case 'healthy': return 'text-green-500 border-green-500';
      default: return 'text-muted-foreground border-border';
    }
  };

  return (
    <div className="p-6 h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Cyber Range Topology</h1>
      </div>

      <div className="flex flex-1 gap-6 min-h-0">
        <Card className="glass-panel flex-1">
          <CardHeader>
            <CardTitle>Network Map</CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-5rem)] relative">
            <div className="absolute inset-0 bg-black/40 rounded-md border border-border p-4 overflow-auto">
              <div className="grid grid-cols-2 gap-4 h-full">
                {topology?.zones.map(zone => (
                  <div key={zone.id} className="border border-border/50 rounded-lg p-4 bg-secondary/20">
                    <h3 className="font-mono text-sm mb-4 text-muted-foreground uppercase">{zone.name}</h3>
                    <div className="flex flex-wrap gap-4">
                      {topology.assets.filter(a => a.zone === zone.id).map(asset => (
                        <div 
                          key={asset.id}
                          onClick={() => setSelectedAssetId(asset.id)}
                          className={`p-3 rounded border cursor-pointer hover:bg-white/5 transition-colors flex flex-col items-center gap-2 ${getStatusColor(asset.status)}`}
                        >
                          {getIcon(asset.type)}
                          <span className="text-xs font-mono">{asset.ipAddress}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedAssetId && (
          <Card className="glass-panel w-80 shrink-0">
            <CardHeader>
              <CardTitle>Asset Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedAsset ? (
                <div className="space-y-4">
                  <div>
                    <div className="text-xl font-bold">{selectedAsset.name}</div>
                    <div className="text-sm font-mono text-muted-foreground">{selectedAsset.ipAddress}</div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Status:</span>
                      <Badge variant="outline" className={getStatusColor(selectedAsset.status)}>
                        {selectedAsset.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Type:</span>
                      <span className="text-sm capitalize">{selectedAsset.type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-sm">Zone:</span>
                      <span className="text-sm uppercase font-mono">{selectedAsset.zone}</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold mb-2">Services</h4>
                    <div className="flex flex-wrap gap-1">
                      {selectedAsset.services.map(s => (
                        <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <h4 className="text-sm font-semibold mb-2 text-destructive">Vulnerabilities</h4>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      {selectedAsset.vulnerabilities?.map(v => (
                        <li key={v}>• {v}</li>
                      )) || <li>None detected</li>}
                    </ul>
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
