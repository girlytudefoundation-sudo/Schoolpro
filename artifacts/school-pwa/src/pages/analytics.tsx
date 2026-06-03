import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useEffect, useState } from "react";
import { getClasses, getStudents } from "../lib/db";

export default function Analytics() {
  const [stats, setStats] = useState({ classes: 0, students: 0 });

  useEffect(() => {
    Promise.all([getClasses(), getStudents()]).then(([c, s]) => {
      setStats({ classes: c.length, students: s.length });
    });
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif">Analytics</h2>
      <Card>
        <CardHeader>
          <CardTitle>School Analytics Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-muted rounded">
               <h3 className="text-lg font-medium">Total Students</h3>
               <p className="text-3xl font-bold">{stats.students}</p>
             </div>
             <div className="p-4 bg-muted rounded">
               <h3 className="text-lg font-medium">Total Classes</h3>
               <p className="text-3xl font-bold">{stats.classes}</p>
             </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}