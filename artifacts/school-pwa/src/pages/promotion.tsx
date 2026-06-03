import { useState, useEffect, useMemo } from "react";
import { ArrowUpRight, CheckCircle2, XCircle, History, GraduationCap, AlertCircle, AlertTriangle, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { getStudents, getClasses, getResults, getSettings, promoteStudents, getPromotionHistory } from "@/lib/db";

const NEXT_CLASS_MAP: Record<string, string> = {
  "Nursery 1": "Nursery 2",
  "Nursery 2": "Primary 1",
  "Primary 1": "Primary 2",
  "Primary 2": "Primary 3",
  "Primary 3": "Primary 4",
  "Primary 4": "Primary 5",
  "Primary 5": "Primary 6",
  "Primary 6": "JSS 1",
  "JSS 1": "JSS 2",
  "JSS 2": "JSS 3",
  "JSS 3": "SS 1",
  "SS 1": "SS 2",
  "SS 2": "SS 3",
  "SS 3": "Graduated"
};

type PromotionStatus = "Promoted" | "Retained";

export default function Promotion() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  const [session, setSession] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  
  const [decisions, setDecisions] = useState<Record<string, PromotionStatus>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function loadData() {
    setLoading(true);
    try {
      const [cls, sts, res, set, hist] = await Promise.all([
        getClasses(),
        getStudents(),
        getResults(),
        getSettings(),
        getPromotionHistory()
      ]);
      setClasses(cls);
      setStudents(sts);
      setResults(res);
      setHistory(hist);
      setSettings(set);
      if (set?.currentSession && !session) {
        setSession(set.currentSession);
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to load data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);
  
  const nextClassName = useMemo(() => {
    if (!selectedClass) return "";
    return NEXT_CLASS_MAP[selectedClass.name] || "";
  }, [selectedClass]);

  const nextClassId = useMemo(() => {
    if (!nextClassName || nextClassName === "Graduated") return null;
    return classes.find(c => c.name === nextClassName)?.id || null;
  }, [nextClassName, classes]);

  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter(s => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  const studentAverages = useMemo(() => {
    const avgs: Record<string, number> = {};
    for (const s of classStudents) {
      const sRes = results.filter(r => r.studentId === s.id && r.session === session);
      if (sRes.length === 0) {
        avgs[s.id] = 0;
      } else {
        const sum = sRes.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
        avgs[s.id] = sum / sRes.length;
      }
    }
    return avgs;
  }, [classStudents, results, session]);

  // Auto-set decisions when class or session changes
  useEffect(() => {
    const newDecisions: Record<string, PromotionStatus> = {};
    for (const s of classStudents) {
      newDecisions[s.id] = studentAverages[s.id] >= 50 ? "Promoted" : "Retained";
    }
    setDecisions(newDecisions);
  }, [classStudents, studentAverages]);

  const toggleDecision = (studentId: string) => {
    setDecisions(prev => ({
      ...prev,
      [studentId]: prev[studentId] === "Promoted" ? "Retained" : "Promoted"
    }));
  };

  const handleConfirmPromotion = async () => {
    setSaving(true);
    try {
      const promotions = classStudents.map(s => ({
        studentId: s.id,
        fromClassId: selectedClassId,
        toClassId: decisions[s.id] === "Promoted" ? (nextClassId || selectedClassId) : selectedClassId,
        status: decisions[s.id]
      }));

      await promoteStudents(promotions, session);
      toast({ title: "Promotion completed successfully" });
      setConfirmOpen(false);
      setSelectedClassId("");
      await loadData();
    } catch (err) {
      console.error(err);
      toast({ title: "Failed to complete promotion", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const promotedCount = Object.values(decisions).filter(d => d === "Promoted").length;
  const retainedCount = Object.values(decisions).filter(d => d === "Retained").length;

  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || id;
  const getStudentName = (id: string) => {
    const s = students.find(x => x.id === id);
    return s ? `${s.firstName} ${s.lastName}` : id;
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Student Promotion</h1>
          <p className="text-muted-foreground text-sm mt-1">End of session student progression management</p>
        </div>
        <Badge variant="outline" className="text-sm px-3 py-1">
          Current Session: <span className="font-semibold ml-1">{settings?.currentSession}</span>
        </Badge>
      </div>

      <Tabs defaultValue="promote" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="promote" data-testid="tab-promote">Promote Students</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-history">Promotion History</TabsTrigger>
        </TabsList>

        <TabsContent value="promote" className="space-y-6">
          <div className="flex flex-wrap gap-4 items-end bg-card p-4 rounded-lg border shadow-sm">
            <div className="w-48 space-y-1.5">
              <label className="text-sm font-medium">Session</label>
              <Input 
                data-testid="input-session"
                value={session} 
                onChange={(e) => setSession(e.target.value)} 
                placeholder="e.g. 2024/2025" 
              />
            </div>
            <div className="w-64 space-y-1.5">
              <label className="text-sm font-medium">Source Class</label>
              <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                <SelectTrigger data-testid="select-class">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedClass && nextClassName && (
              <div className="ml-auto text-sm text-muted-foreground flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-md">
                <span>Next Class Progression:</span>
                <Badge variant="secondary">{selectedClass.name}</Badge>
                <ArrowUpRight className="w-4 h-4" />
                <Badge variant={nextClassName === "Graduated" ? "default" : "secondary"}>
                  {nextClassName}
                </Badge>
              </div>
            )}
          </div>

          {selectedClassId ? (
            classStudents.length > 0 ? (
              <div className="space-y-4">
                <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead>Student Name</TableHead>
                        <TableHead>Avg Score</TableHead>
                        <TableHead>Decision</TableHead>
                        <TableHead>Next Class</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {classStudents.map(s => {
                        const avg = studentAverages[s.id] || 0;
                        const decision = decisions[s.id] || "Retained";
                        const isPromoted = decision === "Promoted";
                        
                        return (
                          <TableRow key={s.id} data-testid={`student-row-${s.id}`}>
                            <TableCell className="font-medium">{s.firstName} {s.lastName}</TableCell>
                            <TableCell>
                              <span className={`font-mono ${avg < 50 ? 'text-red-600' : ''}`}>
                                {avg.toFixed(1)}%
                              </span>
                            </TableCell>
                            <TableCell>
                              <button 
                                data-testid={`btn-toggle-${s.id}`}
                                onClick={() => toggleDecision(s.id)}
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                  isPromoted 
                                    ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400' 
                                    : 'bg-red-100 text-red-800 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400'
                                }`}
                              >
                                {isPromoted ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                                {decision}
                              </button>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {isPromoted ? (
                                nextClassName === "Graduated" ? (
                                  <Badge variant="default" className="gap-1 bg-primary text-primary-foreground">
                                    <GraduationCap className="w-3 h-3" /> Graduated
                                  </Badge>
                                ) : nextClassName
                              ) : (
                                selectedClass?.name
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex items-center justify-between bg-card border rounded-lg p-4 shadow-sm">
                  <div className="flex gap-6 text-sm">
                    <div>Total: <span className="font-bold">{classStudents.length}</span></div>
                    <div className="text-green-600 dark:text-green-400">Promoted: <span className="font-bold">{promotedCount}</span></div>
                    <div className="text-red-600 dark:text-red-400">Retained: <span className="font-bold">{retainedCount}</span></div>
                  </div>
                  <Button 
                    data-testid="btn-confirm-promotion"
                    onClick={() => setConfirmOpen(true)}
                    disabled={!session || (!nextClassId && nextClassName !== "Graduated")}
                  >
                    Confirm Promotion
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-card rounded-lg border text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No students found in this class.</p>
              </div>
            )
          ) : (
            <div className="text-center py-16 bg-card rounded-lg border border-dashed text-muted-foreground">
              <p>Select a class to begin promotion.</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
            {history.length > 0 ? (
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Session</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>From Class</TableHead>
                    <TableHead>To Class</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.sort((a, b) => b.createdAt - a.createdAt).map(h => (
                    <TableRow key={h.id}>
                      <TableCell className="text-muted-foreground">{new Date(h.date).toLocaleDateString()}</TableCell>
                      <TableCell>{h.session}</TableCell>
                      <TableCell className="font-medium">{getStudentName(h.studentId)}</TableCell>
                      <TableCell>{getClassName(h.fromClassId)}</TableCell>
                      <TableCell>{getClassName(h.toClassId)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={h.status === "Promoted" ? "text-green-600 border-green-200 bg-green-50 dark:bg-transparent" : "text-red-600 border-red-200 bg-red-50 dark:bg-transparent"}>
                          {h.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>No promotion history found.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirm Promotion Action
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-3 text-base">
              <p>You are about to process promotions for <strong>{selectedClass?.name}</strong> for the <strong>{session}</strong> session.</p>
              <ul className="list-disc pl-5 space-y-1 marker:text-muted-foreground">
                <li><strong className="text-green-600 dark:text-green-400">{promotedCount}</strong> students will be promoted to {nextClassName}.</li>
                <li><strong className="text-red-600 dark:text-red-400">{retainedCount}</strong> students will be retained in {selectedClass?.name}.</li>
              </ul>
              <p className="text-sm text-muted-foreground mt-2">This action will update the students' current class and log a permanent record in the promotion history. Are you sure you want to continue?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              data-testid="btn-execute-promotion"
              onClick={handleConfirmPromotion} 
              disabled={saving}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {saving ? "Processing..." : "Confirm Promotion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
