import { useState, useEffect } from "react";
import { getClasses, getStudents, getSettings, initDb } from "../lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Printer } from "lucide-react";

export default function ReportCards() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    getClasses().then(setClasses);
    getSettings().then(setSettings);
  }, []);

  useEffect(() => {
    if (selectedClass) {
      getStudents().then(all => setStudents(all.filter(s => s.classId === selectedClass)));
    } else {
      setStudents([]);
    }
    setSelectedStudent("");
  }, [selectedClass]);

  const handlePrint = () => {
    window.print();
  };

  const student = students.find(s => s.id === selectedStudent);
  const classInfo = classes.find(c => c.id === selectedClass);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold font-serif">Report Cards</h2>
        <Button onClick={handlePrint} disabled={!student} className="gap-2"><Printer className="w-4 h-4"/> Print</Button>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="w-64">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="w-64">
            <Select value={selectedStudent} onValueChange={setSelectedStudent} disabled={!selectedClass}>
              <SelectTrigger><SelectValue placeholder="Select Student" /></SelectTrigger>
              <SelectContent>
                {students.map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {student && settings && (
        <div className="bg-white text-black p-8 rounded-lg shadow-sm border mx-auto max-w-4xl print:shadow-none print:border-none print:m-0 print:p-0 print:block">
          <div className="text-center border-b-4 border-black pb-4 mb-6">
            <h1 className="text-3xl font-bold font-serif uppercase tracking-wider">{settings.schoolName}</h1>
            <p className="text-sm mt-1">{settings.address} | Tel: {settings.phone}</p>
            <p className="text-sm font-serif italic mt-1">"{settings.motto}"</p>
            <h2 className="text-xl font-bold mt-4 uppercase border-2 border-black inline-block px-4 py-1 rounded">Terminal Report Card</h2>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-8 text-sm font-medium border-2 border-black p-4 rounded">
            <div>
              <p className="mb-2">Name: <span className="uppercase font-bold border-b border-black inline-block w-48">{student.firstName} {student.lastName}</span></p>
              <p className="mb-2">Admission No: <span className="uppercase font-bold border-b border-black inline-block w-40">{student.admissionNumber}</span></p>
              <p>Gender: <span className="uppercase font-bold border-b border-black inline-block w-24">{student.gender}</span></p>
            </div>
            <div>
              <p className="mb-2">Class: <span className="uppercase font-bold border-b border-black inline-block w-48">{classInfo?.name}</span></p>
              <p className="mb-2">Session: <span className="uppercase font-bold border-b border-black inline-block w-24">{settings.currentSession}</span></p>
              <p>Term: <span className="uppercase font-bold border-b border-black inline-block w-24">{settings.currentTerm}</span></p>
            </div>
          </div>

          <table className="w-full border-collapse border border-black mb-8 text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-2 text-left">Subjects</th>
                <th className="border border-black p-2 w-20">Test 1<br/><span className="text-xs font-normal">(20)</span></th>
                <th className="border border-black p-2 w-20">Test 2<br/><span className="text-xs font-normal">(20)</span></th>
                <th className="border border-black p-2 w-20">Exam<br/><span className="text-xs font-normal">(60)</span></th>
                <th className="border border-black p-2 w-20">Total<br/><span className="text-xs font-normal">(100)</span></th>
                <th className="border border-black p-2 w-16">Grade</th>
                <th className="border border-black p-2 w-24">Remark</th>
              </tr>
            </thead>
            <tbody>
              {/* Placeholder rows since we aren't fetching results in this mockup yet */}
              <tr>
                <td className="border border-black p-2 font-medium">Mathematics</td>
                <td className="border border-black p-2 text-center">15</td>
                <td className="border border-black p-2 text-center">14</td>
                <td className="border border-black p-2 text-center">45</td>
                <td className="border border-black p-2 text-center font-bold">74</td>
                <td className="border border-black p-2 text-center font-bold">A</td>
                <td className="border border-black p-2 text-center text-xs">Excellent</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-medium">English Language</td>
                <td className="border border-black p-2 text-center">12</td>
                <td className="border border-black p-2 text-center">16</td>
                <td className="border border-black p-2 text-center">50</td>
                <td className="border border-black p-2 text-center font-bold">78</td>
                <td className="border border-black p-2 text-center font-bold">A</td>
                <td className="border border-black p-2 text-center text-xs">Excellent</td>
              </tr>
              <tr>
                <td className="border border-black p-2 font-medium">Basic Science</td>
                <td className="border border-black p-2 text-center">10</td>
                <td className="border border-black p-2 text-center">11</td>
                <td className="border border-black p-2 text-center">40</td>
                <td className="border border-black p-2 text-center font-bold">61</td>
                <td className="border border-black p-2 text-center font-bold">B</td>
                <td className="border border-black p-2 text-center text-xs">Very Good</td>
              </tr>
            </tbody>
          </table>

          <div className="space-y-6 text-sm font-medium">
            <div>
              <p className="mb-2">Class Teacher's Comment:</p>
              <div className="border-b border-black h-6 w-full">A very good performance. Keep it up.</div>
            </div>
            <div>
              <p className="mb-2">Principal's Comment:</p>
              <div className="border-b border-black h-6 w-full">Excellent result. An outstanding student.</div>
            </div>
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="border-b border-black h-8 mb-2"></div>
                <p>Class Teacher's Signature</p>
              </div>
              <div className="text-center">
                <div className="border-b border-black h-8 mb-2"></div>
                <p>Principal's Signature</p>
              </div>
              <div className="text-center">
                <div className="border-b border-black h-8 mb-2"></div>
                <p>Parent's Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
