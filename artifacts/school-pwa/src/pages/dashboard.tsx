import { useEffect, useState } from "react";
import { getStudents, getStaff, getClasses, getSettings } from "../lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Users, GraduationCap, Layers, Activity } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    students: 0,
    staff: 0,
    classes: 0,
    attendance: 95 // placeholder
  });
  const [settings, setSchoolSettings] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      const [students, staff, classes, schoolSettings] = await Promise.all([
        getStudents(),
        getStaff(),
        getClasses(),
        getSettings()
      ]);
      setStats({
        students: students.length,
        staff: staff.length,
        classes: classes.length,
        attendance: 98
      });
      setSchoolSettings(schoolSettings);
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground font-serif">Dashboard</h2>
          {settings && (
            <p className="text-muted-foreground mt-1">
              {settings.schoolName} • Session: {settings.currentSession} • Term: {settings.currentTerm}
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-t-4 border-t-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <GraduationCap className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.students}</div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-t-4 border-t-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Staff</CardTitle>
            <Users className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.staff}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Classes</CardTitle>
            <Layers className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.classes}</div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-t-4 border-t-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <Activity className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.attendance}%</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Recent Students</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Loading recent students...</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
             {/* Add quick action buttons here */}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
