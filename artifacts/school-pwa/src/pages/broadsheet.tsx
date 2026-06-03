import { useState, useEffect } from "react";
import { getClasses, getStudents } from "../lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

export default function Broadsheet() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");

  useEffect(() => {
    getClasses().then(setClasses);
  }, []);

  useEffect(() => {
    if (selectedClass) {
      getStudents().then(all => setStudents(all.filter(s => s.classId === selectedClass)));
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif">Broadsheet</h2>
      <Card>
        <CardHeader>
          <CardTitle>Class Broadsheet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-64 mb-6">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {selectedClass && (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-16">S/N</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead className="text-center">MTH</TableHead>
                    <TableHead className="text-center">ENG</TableHead>
                    <TableHead className="text-center">SCI</TableHead>
                    <TableHead className="text-center bg-primary/10">Total</TableHead>
                    <TableHead className="text-center bg-primary/10">Avg</TableHead>
                    <TableHead className="text-center bg-primary/10">Pos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s, i) => (
                    <TableRow key={s.id}>
                      <TableCell>{i + 1}</TableCell>
                      <TableCell className="font-semibold uppercase">{s.firstName} {s.lastName}</TableCell>
                      <TableCell className="text-center">74</TableCell>
                      <TableCell className="text-center">78</TableCell>
                      <TableCell className="text-center">61</TableCell>
                      <TableCell className="text-center font-bold bg-primary/5">213</TableCell>
                      <TableCell className="text-center font-bold bg-primary/5">71.0</TableCell>
                      <TableCell className="text-center font-bold bg-primary/5">1st</TableCell>
                    </TableRow>
                  ))}
                  {students.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        No students in this class.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
