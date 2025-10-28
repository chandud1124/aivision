import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Camera, Plus } from "lucide-react";
import { useEffect, useState } from 'react';
import api from '@/lib/api';

export default function Departments() {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    api.get('/api/departments')
      .then((res) => {
        if (mounted && Array.isArray(res.data)) setDepartments(res.data);
      })
      .catch(() => {
        if (mounted) setDepartments([]);
      })
      .finally(() => mounted && setLoading(false));
    return () => { mounted = false; };
  }, []);

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Departments</h1>
            <p className="text-muted-foreground mt-1">Manage departments and facilities</p>
          </div>
          <Button className="bg-gradient-primary">
            <Plus className="h-4 w-4 mr-2" />
            Add Department
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {loading ? (
            <div>Loading departments...</div>
          ) : (
            departments.map((dept) => {
              return (
            <Card key={dept.id} className="shadow-md hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5 text-primary" />
                      {dept.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{dept.building}</p>
                  </div>
                  <Badge variant="outline">{dept.rooms} Rooms</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-card border">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-primary" />
                      <span className="text-muted-foreground">Students</span>
                    </div>
                    <span className="font-semibold">{dept.students}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-card border">
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-accent" />
                      <span className="text-muted-foreground">Faculty</span>
                    </div>
                    <span className="font-semibold">{dept.faculty}</span>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-card border">
                    <div className="flex items-center gap-2 text-sm">
                      <Camera className="h-4 w-4 text-success" />
                      <span className="text-muted-foreground">Cameras</span>
                    </div>
                    <span className="font-semibold">{dept.cameras}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Edit
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
