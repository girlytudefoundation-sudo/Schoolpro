import { useState, useEffect } from "react";
import { getClasses, getStudents, getSubjects, initDb } from "../lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { useToast } from "../hooks/use-toast";

export default function Results() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [term, setTerm] = useState("1st");
  const [session, setSession] = useState("2024/2025");

  const [scores, setScores] = useState<Record<string, { test1: string, test2: string, exam: string }>>({});

  useEffect(() => {
    getClasses().then(setClasses);
    getSubjects().then(setSubjects);
  }, []);

  useEffect(() => {
    if (selectedClass) {
      getStudents().then(all => setStudents(all.filter(s => s.classId === selectedClass)));
    } else {
      setStudents([]);
    }
    setSelectedStudent("");
  }, [selectedClass]);

  const handleScoreChange = (subjectId: string, field: 'test1' | 'test2' | 'exam', value: string) => {
    setScores(prev => ({
      ...prev,
      [subjectId]: {
        ...prev[subjectId],
        [field]: value
      }
    }));
  };

  const calculateGrade = (total: number) => {
    if (total >= 70) return { grade: "A", remark: "Excellent" };
    if (total >= 60) return { grade: "B", remark: "Very Good" };
    if (total >= 50) return { grade: "C", remark: "Good" };
    if (total >= 40) return { grade: "D", remark: "Pass" };
    return { grade: "F", remark: "Fail" };
  };

  const handleSave = async () => {
    if (!selectedClass || !selectedStudent) {
      toast({ title: "Please select class and student", variant: "destructive" });
      return;
    }

    try {
      const db = await initDb();
      const tx = db.transaction("results", "readwrite");
      
      const classSubjects = subjects.filter(s => s.classId === selectedClass);
      
      for (const sub of classSubjects) {
        const s = scores[sub.id] || { test1: "0", test2: "0", exam: "0" };
        const test1 = Number(s.test1) || 0;
        const test2 = Number(s.test2) || 0;
        const exam = Number(s.exam) || 0;
        const total = test1 + test2 + exam;
        const { grade, remark } = calculateGrade(total);
        
        await tx.objectStore("results").put({
          id: `${selectedStudent}_${sub.id}_${term}_${session}`,
          studentId: selectedStudent,
          subjectId: sub.id,
          classId: selectedClass,
          term,
          session,
          test1,
          test2,
          exam,
          total,
          grade,
          remarks: remark,
          updatedAt: Date.now()
        });
      }
      await tx.done;
      toast({ title: "Results saved successfully" });
    } catch (e) {
      toast({ title: "Failed to save results", variant: "destructive" });
    }
  };

  const classSubjects = subjects.filter(s => s.classId === selectedClass);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif">Results Management</h2>
      <Card>
        <CardHeader>
          <CardTitle>Enter Scores</CardTitle>
          <CardDescription>Select a class and student to input their academic results.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Student</Label>
              <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={!selectedClass}>
                <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
                <SelectContent>
                  {students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Term</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger><SelectValue placeholder="Select Term" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st">1st Term</SelectItem>
                  <SelectItem value="2nd">2nd Term</SelectItem>
                  <SelectItem value="3rd">3rd Term</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Session</Label>
              <Input value={session} onChange={e => setSession(e.target.value)} />
            </div>
          </div>

          {selectedStudent && classSubjects.length > 0 && (
            <div className="mt-8 border rounded-md p-4 bg-muted/20">
              <h3 className="font-semibold mb-4 text-lg">Subject Scores</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 font-medium text-sm text-muted-foreground pb-2 border-b">
                  <div className="col-span-4">Subject</div>
                  <div className="col-span-2 text-center">Test 1 (20)</div>
                  <div className="col-span-2 text-center">Test 2 (20)</div>
                  <div className="col-span-2 text-center">Exam (60)</div>
                  <div className="col-span-2 text-center">Total</div>
                </div>
                {classSubjects.map(sub => {
                  const s = scores[sub.id] || { test1: "", test2: "", exam: "" };
                  const t1 = Number(s.test1) || 0;
                  const t2 = Number(s.test2) || 0;
                  const ex = Number(s.exam) || 0;
                  const total = t1 + t2 + ex;
                  const { grade } = calculateGrade(total);
                  
                  return (
                    <div key={sub.id} className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4 font-medium">{sub.name}</div>
                      <div className="col-span-2">
                        <Input type="number" min="0" max="20" value={s.test1} onChange={e => handleScoreChange(sub.id, 'test1', e.target.value)} className="text-center" />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" min="0" max="20" value={s.test2} onChange={e => handleScoreChange(sub.id, 'test2', e.target.value)} className="text-center" />
                      </div>
                      <div className="col-span-2">
                        <Input type="number" min="0" max="60" value={s.exam} onChange={e => handleScoreChange(sub.id, 'exam', e.target.value)} className="text-center" />
                      </div>
                      <div className="col-span-2 text-center font-bold">
                        {total} <span className="text-muted-foreground text-sm font-normal ml-1">({grade})</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-6 flex justify-end">
                <Button onClick={handleSave} size="lg">Save Results</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
