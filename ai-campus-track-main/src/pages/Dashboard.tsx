import DashboardLayout from "@/components/DashboardLayout";
import StatCard from "@/components/StatCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock,
  Camera,
  TrendingUp,
  LogIn,
  LogOut
} from "lucide-react";
import { useAttendanceRecords, useCheckIn, useCheckOut } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export default function Dashboard() {
  const { user } = useAuth();
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Fetch today's attendance records with auto-refresh every 10 seconds
  const { data: attendanceData, isLoading } = useAttendanceRecords(
    { start_date: today, end_date: today }
  );
  
  // Check-in/out mutations
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  
  // Find user's today record to determine if checked in
  const userTodayRecord = attendanceData?.find(
    (record: any) => record.user_id === user?.id && !record.check_out_time
  );
  const isCheckedIn = !!userTodayRecord;
  
  // Calculate stats
  const totalPresent = attendanceData?.filter((r: any) => r.check_in_time).length || 0;
  const checkedOut = attendanceData?.filter((r: any) => r.check_out_time).length || 0;
  const stillPresent = totalPresent - checkedOut;
  
  // Recent activity - last 10 records
  const recentActivity = attendanceData?.slice(0, 10).map((record: any) => ({
    id: record.id,
    name: record.user?.full_name || record.user?.username || 'Unknown',
    department: record.user?.role || 'N/A',
    time: format(new Date(record.check_in_time), 'HH:mm'),
    status: record.check_out_time ? 'checked-out' : 'present',
    room: record.location || 'N/A',
  })) || [];

  const handleCheckIn = () => {
    if (!user) return;
    checkIn.mutate({
      user_id: user.id,
      verification_method: 'manual',
    });
  };

  const handleCheckOut = () => {
    if (!user) return;
    checkOut.mutate(user.id);
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.full_name || user?.username}!</h1>
            <p className="text-muted-foreground mt-1">Real-time attendance monitoring and analytics</p>
          </div>
          <div className="flex gap-3">
            {!isCheckedIn ? (
              <Button
                onClick={handleCheckIn}
                disabled={checkIn.isPending || isLoading}
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                {checkIn.isPending ? 'Checking in...' : 'Check In'}
              </Button>
            ) : (
              <Button
                onClick={handleCheckOut}
                disabled={checkOut.isPending || isLoading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                {checkOut.isPending ? 'Checking out...' : 'Check Out'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Present Today"
            value={stillPresent.toString()}
            icon={UserCheck}
            variant="success"
          />
          <StatCard
            title="Checked Out"
            value={checkedOut.toString()}
            icon={UserX}
            variant="default"
          />
          <StatCard
            title="Your Status"
            value={isCheckedIn ? 'Present' : 'Not Checked In'}
            icon={Clock}
            variant={isCheckedIn ? 'success' : 'warning'}
          />
          <StatCard
            title="Total Check-ins"
            value={totalPresent.toString()}
            icon={Users}
            variant="default"
          />
        </div>

        <Card className="shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Today's Attendance Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading activity...</p>
            ) : recentActivity.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No attendance records today</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-gradient-card border">
                    <div className="flex-1">
                      <p className="font-medium">{activity.name}</p>
                      <p className="text-sm text-muted-foreground">{activity.department} • {activity.room}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={activity.status === "present" ? "default" : "secondary"}
                        className={
                          activity.status === "present" 
                            ? "bg-success text-success-foreground" 
                            : "bg-muted text-muted-foreground"
                        }
                      >
                        {activity.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
