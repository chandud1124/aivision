import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Calendar,
  Search,
  Filter,
  Download,
  Clock
} from "lucide-react";
import { useAttendanceRecords } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

export default function AttendanceHistory() {
  const { user } = useAuth();
  const [startDate, setStartDate] = useState(
    format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch attendance records with date range
  const { data: attendanceData, isLoading, refetch } = useAttendanceRecords({
    start_date: startDate,
    end_date: endDate,
  });

  // Filter records based on search query
  const filteredRecords = attendanceData?.filter((record: any) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const name = (record.user?.full_name || record.user?.username || '').toLowerCase();
    const location = (record.location || '').toLowerCase();
    return name.includes(searchLower) || location.includes(searchLower);
  }) || [];

  const calculateDuration = (checkIn: string, checkOut: string | null) => {
    if (!checkOut) return 'Still present';
    const duration = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const handleApplyFilter = () => {
    refetch();
  };

  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Attendance History</h1>
            <p className="text-muted-foreground mt-1">View and filter attendance records</p>
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Name or location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="flex items-end">
                <Button onClick={handleApplyFilter} className="w-full">
                  Apply Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Records</p>
                  <p className="text-2xl font-bold">{filteredRecords.length}</p>
                </div>
                <Calendar className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Checked Out</p>
                  <p className="text-2xl font-bold">
                    {filteredRecords.filter((r: any) => r.check_out_time).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-success" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Still Present</p>
                  <p className="text-2xl font-bold">
                    {filteredRecords.filter((r: any) => !r.check_out_time).length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-warning" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Records</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading records...</p>
            ) : filteredRecords.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No records found</p>
            ) : (
              <div className="relative overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase bg-muted/50">
                    <tr>
                      <th className="px-6 py-3 text-left">Name</th>
                      <th className="px-6 py-3 text-left">Role</th>
                      <th className="px-6 py-3 text-left">Check In</th>
                      <th className="px-6 py-3 text-left">Check Out</th>
                      <th className="px-6 py-3 text-left">Duration</th>
                      <th className="px-6 py-3 text-left">Location</th>
                      <th className="px-6 py-3 text-left">Method</th>
                      <th className="px-6 py-3 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((record: any) => (
                      <tr key={record.id} className="border-b hover:bg-muted/30">
                        <td className="px-6 py-4 font-medium">
                          {record.user?.full_name || record.user?.username || 'Unknown'}
                        </td>
                        <td className="px-6 py-4">{record.user?.role || 'N/A'}</td>
                        <td className="px-6 py-4">
                          {format(new Date(record.check_in_time), 'MMM dd, yyyy HH:mm')}
                        </td>
                        <td className="px-6 py-4">
                          {record.check_out_time 
                            ? format(new Date(record.check_out_time), 'MMM dd, yyyy HH:mm')
                            : '-'
                          }
                        </td>
                        <td className="px-6 py-4">
                          {calculateDuration(record.check_in_time, record.check_out_time)}
                        </td>
                        <td className="px-6 py-4">{record.location || 'N/A'}</td>
                        <td className="px-6 py-4 capitalize">{record.verification_method}</td>
                        <td className="px-6 py-4">
                          <Badge 
                            variant={record.check_out_time ? "default" : "secondary"}
                            className={
                              record.check_out_time 
                                ? "bg-muted text-muted-foreground" 
                                : "bg-success text-success-foreground"
                            }
                          >
                            {record.check_out_time ? 'Completed' : 'Present'}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
