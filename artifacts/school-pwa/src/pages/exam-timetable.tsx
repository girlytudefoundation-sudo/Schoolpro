import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Printer, Trash2, Edit2, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { getClasses, getSubjects, getSettings, getExamTimetableByClass, addExamEntry, updateExamEntry, deleteExamEntry, type ExamTimetableEntry } from "@/lib/db";

const TERMS = ["1st", "2nd", "3rd"];

const examEntrySchema = z.object({
  subjectId: z.string().min(1, "Select a subject"),
  date: z.string().min(1, "Date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  venue: z.string().min(1, "Venue is required"),
  session: z.string().min(1, "Session is required"),
  term: z.string().min(1, "Term is required"),
});

type ExamEntryFormData = z.infer<typeof examEntrySchema>;

export default function ExamTimetable() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  
  const [classId, setClassId] = useState("");
  const [session, setSession] = useState("");
  const [term, setTerm] = useState("");
  
  const [timetable, setTimetable] = useState<ExamTimetableEntry[]>([]);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<ExamTimetableEntry | null>(null);

  const form = useForm<ExamEntryFormData>({
    resolver: zodResolver(examEntrySchema),
    defaultValues: { subjectId: "", date: "", startTime: "09:00", endTime: "12:00", venue: "", session: "", term: "" }
  });

  async function loadInitial() {
    try {
      const [cls, sub, set] = await Promise.all([
        getClasses(),
        getSubjects(),
        getSettings()
      ]);
      setClasses(cls);
      setSubjects(sub);
      setSettings(set);
      if (set?.currentSession) setSession(set.currentSession);
      if (set?.currentTerm) setTerm(set.currentTerm);
    } catch (err) {
      toast({ title: "Error loading data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadInitial(); }, []);

  async function loadTimetable(cid: string) {
    if (!cid) {
      setTimetable([]);
      return;
    }
    setLoading(true);
    try {
      const slots = await getExamTimetableByClass(cid);
      setTimetable(slots as ExamTimetableEntry[]);
    } catch (err) {
      toast({ title: "Error loading exam timetable", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTimetable(classId);
  }, [classId]);

  const filteredTimetable = timetable
    .filter(t => t.session === session && t.term === term)
    .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

  const classSubjects = subjects.filter(s => s.classId === classId);

  const handleOpenAdd = () => {
    setEditingEntry(null);
    form.reset({
      subjectId: "",
      date: new Date().toISOString().split("T")[0],
      startTime: "09:00",
      endTime: "12:00",
      venue: "Main Hall",
      session: session || settings?.currentSession || "",
      term: term || settings?.currentTerm || ""
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (entry: ExamTimetableEntry) => {
    setEditingEntry(entry);
    form.reset({
      subjectId: entry.subjectId,
      date: entry.date,
      startTime: entry.startTime,
      endTime: entry.endTime,
      venue: entry.venue,
      session: entry.session,
      term: entry.term
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: ExamEntryFormData) => {
    if (!classId) return;
    try {
      if (editingEntry) {
        await updateExamEntry(editingEntry.id, { ...values, classId });
        toast({ title: "Exam entry updated" });
      } else {
        await addExamEntry({ ...values, classId });
        toast({ title: "Exam entry added" });
      }
      setDialogOpen(false);
      loadTimetable(classId);
    } catch (err) {
      toast({ title: "Error saving exam entry", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this exam entry?")) return;
    try {
      await deleteExamEntry(id);
      loadTimetable(classId);
      toast({ title: "Exam entry deleted" });
    } catch (err) {
      toast({ title: "Error deleting entry", variant: "destructive" });
    }
  };

  const printCard = () => {
    window.print();
  };

  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;

  if (loading && !classes.length) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const selectedClass = classes.find(c => c.id === classId);

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; margin: 0; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold font-serif">Exam Timetable</h1>
          <p className="text-muted-foreground text-sm mt-1">Schedule exams and generate student exam cards</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={printCard} variant="outline" className="gap-2" disabled={!classId || filteredTimetable.length === 0}>
            <Printer className="w-4 h-4" /> Print Exam Card
          </Button>
          <Button onClick={handleOpenAdd} className="gap-2" disabled={!classId}>
            <Plus className="w-4 h-4" /> Add Entry
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-end bg-card p-4 rounded-lg border shadow-sm no-print">
        <div className="w-64 space-y-1.5">
          <label className="text-sm font-medium">Class</label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
            <SelectContent>
              {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="w-40 space-y-1.5">
          <label className="text-sm font-medium">Session</label>
          <Input value={session} onChange={(e) => setSession(e.target.value)} />
        </div>
        <div className="w-40 space-y-1.5">
          <label className="text-sm font-medium">Term</label>
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger>
            <SelectContent>
              {TERMS.map(t => <SelectItem key={t} value={t}>{t} Term</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {classId ? (
        <div id="print-area">
          <div className="hidden print:block mb-8 text-center border-2 border-black p-6 rounded-lg">
            <h1 className="text-2xl font-bold font-serif uppercase tracking-wider">{settings?.schoolName || "School"}</h1>
            <div className="h-0.5 bg-black w-32 mx-auto my-3" />
            <h2 className="text-lg font-bold">EXAMINATION TIMETABLE</h2>
            <div className="flex justify-center gap-8 mt-4 font-medium">
              <p>CLASS: {selectedClass?.name}</p>
              <p>SESSION: {session}</p>
              <p>TERM: {term} Term</p>
            </div>
          </div>

          <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
            {filteredTimetable.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Venue</TableHead>
                    <TableHead className="text-right no-print">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTimetable.map(entry => {
                    const d = new Date(entry.date);
                    return (
                      <TableRow key={entry.id}>
                        <TableCell>
                          <div className="font-medium">{d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</div>
                        </TableCell>
                        <TableCell className="font-semibold text-primary">{getSubjectName(entry.subjectId)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            {entry.startTime} - {entry.endTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            {entry.venue}
                          </div>
                        </TableCell>
                        <TableCell className="text-right no-print">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleOpenEdit(entry)}>
                            <Edit2 className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:text-destructive text-destructive/70" onClick={() => handleDelete(entry.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <p>No exams scheduled for this class, session, and term.</p>
              </div>
            )}
          </div>

          <div className="hidden print:block mt-8 text-center text-sm font-medium border-t-2 border-dashed border-black/30 pt-6">
            <p>NOTE: Students are expected to arrive 30 minutes before the exam.</p>
            <p className="mt-1">Any form of examination malpractice will lead to disqualification.</p>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-lg border border-dashed text-muted-foreground no-print">
          <p>Select a class to manage its exam timetable.</p>
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Exam Entry" : "Add Exam Entry"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="subjectId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {classSubjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                      {classSubjects.length === 0 && <SelectItem value="none" disabled>No subjects found</SelectItem>}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem>
                  <FormLabel>Date</FormLabel>
                  <FormControl><Input type="date" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Time</FormLabel>
                    <FormControl><Input type="time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endTime" render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Time</FormLabel>
                    <FormControl><Input type="time" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="venue" render={({ field }) => (
                <FormItem>
                  <FormLabel>Venue</FormLabel>
                  <FormControl><Input placeholder="e.g. Hall A" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="session" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Session</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="term" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Term</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Term" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {TERMS.map(t => <SelectItem key={t} value={t}>{t} Term</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                <Button type="submit">Save Entry</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
