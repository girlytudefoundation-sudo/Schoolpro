import { useEffect, useState } from "react";
import { getStudents, initDb } from "../lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, Plus, Trash2, Edit2 } from "lucide-react";
import { useToast } from "../hooks/use-toast";

export default function Students() {
  const { toast } = useToast();
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  const loadStudents = async () => {
    const data = await getStudents();
    setStudents(data.sort((a, b) => b.createdAt - a.createdAt));
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleDelete = async (id: string) => {
    if(!confirm("Are you sure you want to delete this student?")) return;
    try {
      const db = await initDb();
      await db.delete("students", id);
      toast({ title: "Student deleted" });
      loadStudents();
    } catch(e) {
      toast({ title: "Failed to delete", variant: "destructive" });
    }
  };

  const filteredStudents = students.filter(s => 
    s.firstName.toLowerCase().includes(search.toLowerCase()) || 
    s.lastName.toLowerCase().includes(search.toLowerCase()) ||
    s.admissionNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold font-serif">Students</h2>
        <Button className="gap-2"><Plus className="w-4 h-4"/> Add Student</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex justify-between items-center">
            <CardTitle>All Students</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search students..." 
                className="pl-8" 
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[120px]">Adm No.</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-muted-foreground">{s.admissionNumber}</TableCell>
                    <TableCell className="font-semibold">{s.firstName} {s.lastName}</TableCell>
                    <TableCell>{s.classId}</TableCell>
                    <TableCell>{s.gender}</TableCell>
                    <TableCell>{s.guardianName}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="icon" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="text-destructive border-destructive/20 hover:bg-destructive/10" onClick={() => handleDelete(s.id)} title="Delete">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredStudents.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No students found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}