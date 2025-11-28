import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart3, Download, TrendingUp, Calendar } from "lucide-react";

export default function Analytics() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics & Reports</h1>
            <p className="text-muted-foreground mt-1">Comprehensive attendance insights and trends</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Date Range
            </Button>
            <Button className="bg-gradient-primary">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">87.5%</p>
                <p className="text-xs text-success flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  +2.3% from last month
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Peak Attendance Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">9:00 AM</p>
                <p className="text-xs text-muted-foreground">Morning classes most attended</p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Defaulter Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold">12.5%</p>
                <p className="text-xs text-destructive flex items-center gap-1">
                  Below 75% attendance threshold
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Weekly Attendance Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between gap-2">
                {[85, 88, 82, 90, 87, 86, 89].map((value, idx) => (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-gradient-primary rounded-t-lg relative" style={{ height: `${value}%` }}>
                      <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium">
                        {value}%
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][idx]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Department Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { dept: "Mathematics", attendance: 90, color: "success" },
                  { dept: "Chemistry", attendance: 90, color: "success" },
                  { dept: "Engineering", attendance: 89, color: "success" },
                  { dept: "Computer Science", attendance: 87, color: "primary" },
                  { dept: "Physics", attendance: 83, color: "warning" },
                ].map((item) => (
                  <div key={item.dept} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{item.dept}</span>
                      <span className="text-muted-foreground">{item.attendance}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div 
                        className={`h-full transition-all ${
                          item.color === "success" ? "bg-success" :
                          item.color === "warning" ? "bg-warning" :
                          "bg-gradient-primary"
                        }`}
                        style={{ width: `${item.attendance}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { month: "January", present: 1180, absent: 110, percentage: 91 },
                { month: "February", present: 1142, absent: 148, percentage: 88 },
                { month: "March", present: 1205, absent: 85, percentage: 93 },
                { month: "April", present: 1168, absent: 122, percentage: 90 },
              ].map((month) => (
                <div key={month.month} className="p-4 rounded-lg bg-gradient-card border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{month.month}</span>
                    <Badge variant="outline">{month.percentage}%</Badge>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <span className="text-muted-foreground">
                      Present: <span className="font-medium text-foreground">{month.present}</span>
                    </span>
                    <span className="text-muted-foreground">
                      Absent: <span className="font-medium text-foreground">{month.absent}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
