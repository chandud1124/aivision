import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Plus, Users } from "lucide-react";
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function Roles() {
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/api/roles')
      .then(res => { if (mounted && Array.isArray(res.data)) setRoles(res.data); })
      .catch(() => { if (mounted) setRoles([]); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
            <p className="text-muted-foreground mt-1">Configure access control and permissions</p>
          </div>
          <Button className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Create Custom Role
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => (
            <Card key={role.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="h-5 w-5 text-primary" />
                      {role.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      <span>{role.users} users</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Permissions:</p>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map((permission, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit Permissions
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    View Users
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Permission Matrix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium">Feature</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Super Admin</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Dept Admin</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">Faculty</th>
                      <th className="px-4 py-3 text-center text-sm font-medium">IT Admin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { feature: "View Dashboard", values: ["✓", "✓", "✓", "✓"] },
                      { feature: "Manage Users", values: ["✓", "✓", "—", "—"] },
                      { feature: "Camera Control", values: ["✓", "—", "—", "✓"] },
                      { feature: "Generate Reports", values: ["✓", "✓", "✓", "—"] },
                      { feature: "System Settings", values: ["✓", "—", "—", "✓"] },
                    ].map((row, idx) => (
                      <tr key={idx} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-3 font-medium">{row.feature}</td>
                        {row.values.map((value, i) => (
                          <td key={i} className="px-4 py-3 text-center">
                            <span className={value === "✓" ? "text-success font-bold" : "text-muted-foreground"}>
                              {value}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
