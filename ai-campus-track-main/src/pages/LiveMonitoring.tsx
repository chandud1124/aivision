import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera, Play, Pause, Maximize2 } from "lucide-react";
import { useEffect, useState } from "react";
import api from '@/lib/api';

export default function LiveMonitoring() {
  const [cameras, setCameras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/api/devices/cameras')
      .then((res) => {
        if (mounted && Array.isArray(res.data)) setCameras(res.data);
      })
      .catch(() => {
        // Keep cameras empty if API not available
        if (mounted) setCameras([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Live Monitoring</h1>
          <p className="text-muted-foreground mt-1">Real-time CCTV feeds with AI facial recognition</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {loading ? (
            <div>Loading cameras...</div>
          ) : (
            cameras.map((camera) => {
              return (
            <Card key={camera.id} className="shadow-md overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    {camera.name}
                  </CardTitle>
                  <Badge 
                    variant={camera.status === "active" ? "default" : "secondary"}
                    className={
                      camera.status === "active" 
                        ? "bg-success text-success-foreground" 
                        : "bg-muted text-muted-foreground"
                    }
                  >
                    {camera.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{camera.location}</p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                  {camera.status === "active" ? (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
                      <Camera className="h-12 w-12 text-muted-foreground/30" />
                      <div className="absolute top-2 left-2 flex gap-1">
                        <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                        <span className="text-xs text-success font-medium">LIVE</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-sm">Under Maintenance</div>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Faces Detected:</span>
                  <span className="font-semibold">{camera.faces}</span>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Play className="h-3 w-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline">
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
