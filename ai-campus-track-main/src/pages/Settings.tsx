import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Settings as SettingsIcon, Save, Camera, Bell, Shield, Clock } from "lucide-react";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1">Configure system preferences and behavior</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-primary" />
                AI & Camera Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="confidence">Recognition Confidence Threshold</Label>
                <div className="flex items-center gap-4">
                  <Input id="confidence" type="number" defaultValue="85" className="flex-1" />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scan-interval">Scan Interval</Label>
                <Input id="scan-interval" type="number" defaultValue="30" placeholder="Minutes" />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Continuous Scanning</Label>
                  <p className="text-sm text-muted-foreground">Enable 24/7 face detection</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Motion Detection</Label>
                  <p className="text-sm text-muted-foreground">Trigger scan on movement</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button className="w-full bg-gradient-primary">
                <Save className="h-4 w-4 mr-2" />
                Save Camera Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                Notifications & Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive attendance alerts via email</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>SMS Alerts</Label>
                  <p className="text-sm text-muted-foreground">Send SMS for critical events</p>
                </div>
                <Switch />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Proxy Detection Alerts</Label>
                  <p className="text-sm text-muted-foreground">Notify on suspicious activity</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Daily Summary Reports</Label>
                  <p className="text-sm text-muted-foreground">Automated daily attendance summary</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button className="w-full bg-gradient-primary">
                <Save className="h-4 w-4 mr-2" />
                Save Notification Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Two-Factor Authentication</Label>
                  <p className="text-sm text-muted-foreground">Require 2FA for admin access</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">Track all system actions</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Data Encryption</Label>
                  <p className="text-sm text-muted-foreground">AES-256 encryption enabled</p>
                </div>
                <Switch defaultChecked disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="retention">Data Retention Period</Label>
                <Input id="retention" type="number" defaultValue="90" placeholder="Days" />
              </div>

              <Button className="w-full bg-gradient-primary">
                <Save className="h-4 w-4 mr-2" />
                Save Security Settings
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Attendance Rules
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="late-threshold">Late Arrival Threshold</Label>
                <div className="flex items-center gap-4">
                  <Input id="late-threshold" type="number" defaultValue="10" className="flex-1" />
                  <span className="text-sm text-muted-foreground">minutes</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-attendance">Minimum Attendance Requirement</Label>
                <div className="flex items-center gap-4">
                  <Input id="min-attendance" type="number" defaultValue="75" className="flex-1" />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Dual Verification</Label>
                  <p className="text-sm text-muted-foreground">Require both RFID & face scan</p>
                </div>
                <Switch defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-mark Absent</Label>
                  <p className="text-sm text-muted-foreground">Mark absent after grace period</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button className="w-full bg-gradient-primary">
                <Save className="h-4 w-4 mr-2" />
                Save Attendance Rules
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
