import { useState, useEffect } from "react";
import { getClasses, getStudents } from "../lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";

export default function Attendance() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  
  const [status, setStatus] = useState<Record<string, string>>({});

  useEffect(() => {
    getClasses().then(setClasses);
  }, []);

  useEffect(() => {
    if (selectedClass) {
      getStudents().then(all => {
        const clsStudents = all.filter(s => s.classId === selectedClass);
        setStudents(clsStudents);
        const initialStatus: Record<string, string> = {};
        clsStudents.forEach(s => initialStatus[s.id] = "Present");
        setStatus(initialStatus);
      });
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif">Attendance</h2>
      <Card>
        <CardHeader>
          <CardTitle>Daily Attendance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="w-64">
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-48">
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
          </div>

          {selectedClass && (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Student Name</TableHead>
                      <TableHead className="w-32 text-center">Present</TableHead>
                      <TableHead className="w-32 text-center">Absent</TableHead>
                      <TableHead className="w-32 text-center">Late</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-semibold uppercase">{s.firstName} {s.lastName}</TableCell>
                        <TableCell className="text-center">
                          <input type="radio" name={`status-${s.id}`} checked={status[s.id] === 'Present'} onChange={() => setStatus(prev => ({...prev, [s.id]: 'Present'}))} className="w-5 h-5 accent-primary" />
                        </TableCell>
                        <TableCell className="text-center">
                          <input type="radio" name={`status-${s.id}`} checked={status[s.id] === 'Absent'} onChange={() => setStatus(prev => ({...prev, [s.id]: 'Absent'}))} className="w-5 h-5 accent-destructive" />
                        </TableCell>
                        <TableCell className="text-center">
                          <input type="radio" name={`status-${s.id}`} checked={status[s.id] === 'Late'} onChange={() => setStatus(prev => ({...prev, [s.id]: 'Late'}))} className="w-5 h-5 accent-orange-500" />
                        </TableCell>
                      </TableRow>
                    ))}
                    {students.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                          No students in this class.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-6 flex justify-end">
                <Button size="lg">Save Attendance</Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
