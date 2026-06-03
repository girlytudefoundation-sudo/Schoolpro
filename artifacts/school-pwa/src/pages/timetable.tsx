import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Printer, Plus, X, Trash2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getClasses, getSubjects, getStaff, getSettings, getTimetableByClass, saveTimetableSlot, deleteTimetableSlot, clearTimetableForClass, type TimetableSlot } from "@/lib/db";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const;
const PERIODS = [
  { p: 1, start: "07:30", end: "08:10" },
  { p: 2, start: "08:10", end: "08:50" },
  { p: 3, start: "08:50", end: "09:30" },
  { p: 4, start: "09:30", end: "10:10" },
  { p: "Break", start: "10:10", end: "10:30" },
  { p: 5, start: "10:30", end: "11:10" },
  { p: 6, start: "11:10", end: "11:50" },
  { p: 7, start: "11:50", end: "12:30" },
  { p: 8, start: "12:30", end: "13:10" }
];

const slotSchema = z.object({
  subjectId: z.string().min(1, "Subject is required"),
  staffId: z.string().optional()
});

type SlotFormData = z.infer<typeof slotSchema>;

export default function Timetable() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  
  const [classId, setClassId] = useState("");
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  
  const [addSlot, setAddSlot] = useState<{ day: string, period: number, start: string, end: string } | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  const form = useForm<SlotFormData>({
    resolver: zodResolver(slotSchema),
    defaultValues: { subjectId: "", staffId: "none" }
  });

  async function loadInitial() {
    try {
      const [cls, sub, stf, set] = await Promise.all([
        getClasses(),
        getSubjects(),
        getStaff(),
        getSettings()
      ]);
      setClasses(cls);
      setSubjects(sub);
      setStaff(stf);
      setSettings(set);
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
      const slots = await getTimetableByClass(cid);
      setTimetable(slots as TimetableSlot[]);
    } catch (err) {
      toast({ title: "Error loading timetable", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTimetable(classId);
  }, [classId]);

  const classSubjects = subjects.filter(s => s.classId === classId);

  const handleSaveSlot = async (values: SlotFormData) => {
    if (!classId || !addSlot) return;
    try {
      await saveTimetableSlot({
        classId,
        day: addSlot.day as any,
        period: addSlot.period,
        subjectId: values.subjectId,
        staffId: values.staffId === "none" ? undefined : values.staffId,
        startTime: addSlot.start,
        endTime: addSlot.end
      });
      toast({ title: "Slot saved" });
      setAddSlot(null);
      form.reset();
      loadTimetable(classId);
    } catch (err) {
      toast({ title: "Error saving slot", variant: "destructive" });
    }
  };

  const handleClearSlot = async (id: string) => {
    try {
      await deleteTimetableSlot(id);
      loadTimetable(classId);
      toast({ title: "Slot cleared" });
    } catch (err) {
      toast({ title: "Error clearing slot", variant: "destructive" });
    }
  };

  const handleClearAll = async () => {
    if (!classId) return;
    try {
      await clearTimetableForClass(classId);
      setClearOpen(false);
      loadTimetable(classId);
      toast({ title: "Timetable cleared" });
    } catch (err) {
      toast({ title: "Error clearing timetable", variant: "destructive" });
    }
  };

  const printTimetable = () => {
    window.print();
  };

  const getSubjectCode = (id: string) => subjects.find(s => s.id === id)?.code || id;
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || id;
  const getStaffName = (id?: string) => staff.find(s => s.id === id)?.name || "";

  if (loading && !classes.length) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}} />

      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold font-serif">Class Timetable</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage weekly schedule and teacher assignments</p>
        </div>
        <Button onClick={printTimetable} variant="outline" className="gap-2" data-testid="btn-print" disabled={!classId}>
          <Printer className="w-4 h-4" /> Print Timetable
        </Button>
      </div>

      <div className="flex gap-4 items-end bg-card p-4 rounded-lg border shadow-sm no-print">
        <div className="w-64 space-y-1.5">
          <label className="text-sm font-medium">Select Class</label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger data-testid="select-class">
              <SelectValue placeholder="Choose a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {classId && (
          <Button variant="destructive" className="ml-auto gap-2" onClick={() => setClearOpen(true)} data-testid="btn-clear-all">
            <Trash2 className="w-4 h-4" /> Clear All
          </Button>
        )}
      </div>

      {classId ? (
        <div id="print-area" className="bg-white dark:bg-card border rounded-lg shadow-sm overflow-x-auto">
          <div className="p-4 sm:p-6 min-w-[800px]">
            <div className="text-center mb-6 hidden print:block">
              <h1 className="text-2xl font-bold font-serif">{settings?.schoolName || "School"}</h1>
              <p className="text-lg mt-1 font-medium border-b-2 border-primary inline-block pb-1">
                {classes.find(c => c.id === classId)?.name} — Weekly Timetable
              </p>
              <p className="text-sm text-muted-foreground mt-2">{settings?.currentSession} Session, {settings?.currentTerm} Term</p>
            </div>

            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-2 bg-muted/40 w-24">Time</th>
                  {DAYS.map(day => (
                    <th key={day} className="border p-2 bg-muted/40 uppercase text-xs tracking-wide">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((period, idx) => {
                  if (period.p === "Break") {
                    return (
                      <tr key={`break-${idx}`}>
                        <td className="border p-2 text-center text-xs font-mono text-muted-foreground whitespace-nowrap bg-muted/10">
                          {period.start} - {period.end}
                        </td>
                        <td colSpan={5} className="border p-2 text-center bg-muted/20 font-semibold tracking-widest text-muted-foreground/60 uppercase">
                          Break Time
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={`period-${period.p}`}>
                      <td className="border p-2 text-center text-xs whitespace-nowrap">
                        <div className="font-semibold mb-0.5">Period {period.p}</div>
                        <div className="font-mono text-muted-foreground">{period.start} - {period.end}</div>
                      </td>
                      {DAYS.map(day => {
                        const slot = timetable.find(t => t.day === day && t.period === period.p);
                        return (
                          <td key={`${day}-${period.p}`} className="border p-2 h-20 align-top relative group w-1/5">
                            {slot ? (
                              <div className="flex flex-col h-full justify-between">
                                <div className="flex items-start justify-between gap-1">
                                  <span className="font-bold text-sm text-primary" title={getSubjectName(slot.subjectId)}>
                                    {getSubjectCode(slot.subjectId)}
                                  </span>
                                  <button 
                                    className="text-muted-foreground hover:text-destructive p-1 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity no-print -mt-1 -mr-1"
                                    onClick={() => handleClearSlot(slot.id)}
                                    title="Remove"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                                {slot.staffId && (
                                  <span className="text-xs text-muted-foreground leading-tight line-clamp-2 mt-1">
                                    {getStaffName(slot.staffId)}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full w-full opacity-0 group-hover:opacity-100 transition-opacity no-print">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 w-8 p-0 rounded-full"
                                  onClick={() => setAddSlot({ day, period: period.p as number, start: period.start, end: period.end })}
                                >
                                  <Plus className="w-4 h-4 text-muted-foreground" />
                                </Button>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-lg border border-dashed text-muted-foreground no-print">
          <p>Select a class to view or edit its timetable.</p>
        </div>
      )}

      {/* Add Slot Dialog */}
      <Dialog open={!!addSlot} onOpenChange={(o) => !o && setAddSlot(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Subject</DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">
              {addSlot?.day}, Period {addSlot?.period} <span className="font-mono ml-2">({addSlot?.start} - {addSlot?.end})</span>
            </p>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSaveSlot)} className="space-y-4">
              <FormField control={form.control} name="subjectId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger></FormControl>
                    <SelectContent>
                      {classSubjects.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                      ))}
                      {classSubjects.length === 0 && <SelectItem value="disabled" disabled>No subjects for this class</SelectItem>}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              
              <FormField control={form.control} name="staffId" render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher (Optional)</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select teacher" /></SelectTrigger></FormControl>
                    <SelectContent>
                      <SelectItem value="none">-- Unassigned --</SelectItem>
                      {staff.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setAddSlot(null)}>Cancel</Button>
                <Button type="submit" disabled={!form.watch("subjectId")}>Save Slot</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Clear All Confirm */}
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Clear Timetable
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear the entire timetable for {classes.find(c => c.id === classId)?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleClearAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Clear All Slots
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
