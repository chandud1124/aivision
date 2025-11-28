import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Server, Database, Wifi, HardDrive, Cpu } from "lucide-react";
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function SystemHealth() {
  const [services, setServices] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    let mounted = true;
    // Try to fetch runtime system info and recent events; fall back to defaults
    api.get('/api/system/services')
      .then(res => { if (mounted && Array.isArray(res.data)) setServices(res.data); })
      .catch(() => {
        if (mounted) setServices([]);
      });

    api.get('/api/system/events')
      .then(res => { if (mounted && Array.isArray(res.data)) setEvents(res.data); })
      .catch(() => {
        if (mounted) setEvents([]);
      });

    return () => { mounted = false; };
  }, []);
  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Health</h1>
          <p className="text-muted-foreground mt-1">Monitor system performance and infrastructure</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-md border-success/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">System Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-success">Operational</p>
                  <p className="text-xs text-muted-foreground">All systems normal</p>
                </div>
                <Activity className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Server Uptime</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">99.98%</p>
                  <p className="text-xs text-muted-foreground">45 days running</p>
                </div>
                <Server className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Database</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">Healthy</p>
                  <p className="text-xs text-muted-foreground">12ms avg query</p>
                </div>
                <Database className="h-8 w-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Network</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-2xl font-bold">Stable</p>
                  <p className="text-xs text-muted-foreground">8ms latency</p>
                </div>
                <Wifi className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-5 w-5 text-primary" />
                Resource Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">CPU Usage</span>
                  <span className="text-muted-foreground">42%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-primary" style={{ width: "42%" }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Memory Usage</span>
                  <span className="text-muted-foreground">68%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-primary" style={{ width: "68%" }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Disk Usage</span>
                  <span className="text-muted-foreground">55%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-primary" style={{ width: "55%" }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Network Bandwidth</span>
                  <span className="text-muted-foreground">34%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-primary" style={{ width: "34%" }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>AI Processing Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(services.length > 0 ? services : []).map((service) => (
                <div key={service.name} className="p-3 rounded-lg bg-gradient-card border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm">{service.name}</span>
                    <Badge 
                      variant="outline"
                      className={service.status === "active" ? "bg-success/10 text-success border-success/30" : ""}
                    >
                      {service.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                      <div 
                        className="h-full bg-accent transition-all" 
                        style={{ width: `${service.load}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-10 text-right">{service.load}%</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Recent System Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(events.length > 0 ? events : []).map((log, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-gradient-card border">
                  <div className={`h-2 w-2 rounded-full ${
                    log.type === "success" ? "bg-success" :
                    log.type === "warning" ? "bg-warning" :
                    "bg-primary"
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{log.event}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{log.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
