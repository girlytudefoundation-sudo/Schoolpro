import { useState, useEffect } from "react";
import { getClasses, getStudents, getSettings } from "../lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { Printer } from "lucide-react";

export default function IdCards() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
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
  }, [selectedClass]);

  const classInfo = classes.find(c => c.id === selectedClass);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold font-serif">Student ID Cards</h2>
        <Button onClick={() => window.print()} disabled={!selectedClass} className="gap-2"><Printer className="w-4 h-4"/> Print All</Button>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Select Class</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-64">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
              <SelectContent>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {selectedClass && settings && (
        <div className="grid grid-cols-2 gap-8 print:grid-cols-2 print:gap-4 print:p-0">
          {students.map(s => (
            <div key={s.id} className="w-[3.375in] h-[2.125in] border border-gray-300 rounded-xl overflow-hidden flex flex-col relative shadow-md bg-white text-black shrink-0 print:break-inside-avoid">
              <div className="bg-primary text-primary-foreground text-center py-2 shrink-0">
                <h3 className="font-serif font-bold text-sm leading-tight uppercase px-2">{settings.schoolName}</h3>
                <p className="text-[10px] opacity-90">{settings.address}</p>
              </div>
              <div className="flex-1 flex items-center p-3 gap-3 relative z-10">
                <div className="w-20 h-24 bg-muted border-2 border-white shadow-sm shrink-0 flex items-center justify-center text-muted-foreground text-2xl font-bold uppercase rounded">
                  {s.firstName[0]}{s.lastName[0]}
                </div>
                <div className="flex-1 space-y-1">
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Name</p>
                    <p className="font-bold text-sm uppercase leading-tight">{s.lastName}, {s.firstName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">Class</p>
                    <p className="font-semibold text-sm">{classInfo?.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">ID Number</p>
                    <p className="font-mono font-bold text-primary">{s.admissionNumber}</p>
                  </div>
                </div>
              </div>
              <div className="bg-primary h-2 w-full shrink-0"></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}