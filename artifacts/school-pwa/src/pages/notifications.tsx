import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Send, Copy, Users, CheckSquare, Square, Phone, Trash2, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getStudents, getClasses, getSettings } from "@/lib/db";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  gender: string;
  classId: string;
  guardianName: string;
  guardianPhone: string;
  admissionNumber: string;
}

interface ClassObj { id: string; name: string; level: string }

interface NotificationLog {
  id: string;
  timestamp: number;
  type: string;
  recipients: number;
  message: string;
  channel: string;
}

const LOG_KEY = "schoolpro-notification-log";

const MESSAGE_TYPES = [
  { value: "attendance-absent", label: "Attendance — Absent Alert" },
  { value: "attendance-late", label: "Attendance — Late Alert" },
  { value: "results-ready", label: "Results — Term Results Ready" },
  { value: "results-summary", label: "Results — Individual Score Summary" },
  { value: "general", label: "General Announcement" },
  { value: "fees", label: "School Fees Reminder" },
  { value: "custom", label: "Custom Message" },
];

function buildTemplate(
  type: string,
  student: Student,
  schoolName: string,
  session: string,
  term: string,
  date: string,
  extraData?: { score?: number; grade?: string; position?: string }
): string {
  const name = `${student.firstName} ${student.lastName}`;
  const guardian = student.guardianName;
  switch (type) {
    case "attendance-absent":
      return `Dear ${guardian}, this is to inform you that your ward ${name} (Admission No: ${student.admissionNumber}) was ABSENT from school today, ${date}. Please contact the school if you have any questions. — ${schoolName}`;
    case "attendance-late":
      return `Dear ${guardian}, your ward ${name} (Admission No: ${student.admissionNumber}) arrived LATE to school today, ${date}. Please ensure punctuality. — ${schoolName}`;
    case "results-ready":
      return `Dear ${guardian}, the ${term} Term results for ${session} session are now ready. Kindly visit the school to collect the report card for ${name} (${student.admissionNumber}). — ${schoolName}`;
    case "results-summary":
      return `Dear ${guardian}, here is a quick update for ${name}: Total Score: ${extraData?.score ?? "--"}/100, Grade: ${extraData?.grade ?? "--"}, Position: ${extraData?.position ?? "--"}. Contact the school for full details. — ${schoolName}`;
    case "fees":
      return `Dear ${guardian}, this is a reminder that school fees for ${name} (${student.admissionNumber}) for the ${term} Term, ${session} session is due. Kindly visit the school bursar. — ${schoolName}`;
    case "general":
      return `Dear ${guardian}, there is an important announcement from ${schoolName} regarding ${name}. Please contact the school or check the notice board for details.`;
    default:
      return `Dear ${guardian}, this is a message from ${schoolName} regarding your ward ${name} (${student.admissionNumber}).`;
  }
}

export default function Notifications() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassObj[]>([]);
  const [schoolName, setSchoolName] = useState("Greenfield Academy");
  const [currentSession, setCurrentSession] = useState("2024/2025");
  const [currentTerm, setCurrentTerm] = useState("1st");
  const [selectedClass, setSelectedClass] = useState<string>("all");
  const [messageType, setMessageType] = useState("attendance-absent");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customMessage, setCustomMessage] = useState("");
  const [log, setLog] = useState<NotificationLog[]>([]);
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

  useEffect(() => {
    async function load() {
      const [s, c, settings] = await Promise.all([getStudents(), getClasses(), getSettings()]);
      setStudents(s as Student[]);
      setClasses(c as ClassObj[]);
      if (settings) {
        setSchoolName(settings.schoolName);
        setCurrentSession(settings.currentSession);
        setCurrentTerm(settings.currentTerm);
      }
      const stored = localStorage.getItem(LOG_KEY);
      if (stored) {
        try { setLog(JSON.parse(stored)); } catch {}
      }
      setLoading(false);
    }
    load();
  }, []);

  const filteredStudents = selectedClass === "all"
    ? students
    : students.filter((s) => s.classId === selectedClass);

  const allSelected = filteredStudents.length > 0 && filteredStudents.every((s) => selectedIds.has(s.id));

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredStudents.forEach((s) => next.delete(s.id));
        return next;
      });
    } else {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        filteredStudents.forEach((s) => next.add(s.id));
        return next;
      });
    }
  }

  function toggleStudent(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function getMessageForStudent(student: Student) {
    if (messageType === "custom") return customMessage;
    return buildTemplate(messageType, student, schoolName, currentSession, currentTerm, today);
  }

  function getPreviewMessage() {
    const sample = filteredStudents.find((s) => selectedIds.has(s.id)) ?? filteredStudents[0];
    if (!sample) return "Select students to preview the message.";
    if (messageType === "custom") return customMessage || "Enter your custom message below.";
    return buildTemplate(messageType, sample, schoolName, currentSession, currentTerm, today);
  }

  function addToLog(type: string, recipients: number, message: string, channel: string) {
    const entry: NotificationLog = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      recipients,
      message,
      channel,
    };
    setLog((prev) => {
      const next = [entry, ...prev].slice(0, 50);
      localStorage.setItem(LOG_KEY, JSON.stringify(next));
      return next;
    });
  }

  function sendWhatsApp() {
    const selected = filteredStudents.filter((s) => selectedIds.has(s.id));
    if (selected.length === 0) {
      toast({ title: "No students selected", description: "Select at least one student.", variant: "destructive" });
      return;
    }
    let opened = 0;
    selected.forEach((student) => {
      const msg = getMessageForStudent(student);
      const phone = student.guardianPhone.replace(/\D/g, "").replace(/^0/, "234");
      const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, "_blank");
      opened++;
    });
    addToLog(
      MESSAGE_TYPES.find((m) => m.value === messageType)?.label ?? messageType,
      selected.length,
      getPreviewMessage(),
      "WhatsApp"
    );
    toast({ title: `${opened} WhatsApp chat(s) opened`, description: "Each guardian's chat opened in a new tab." });
  }

  function sendSMS() {
    const selected = filteredStudents.filter((s) => selectedIds.has(s.id));
    if (selected.length === 0) {
      toast({ title: "No students selected", description: "Select at least one student.", variant: "destructive" });
      return;
    }
    const phones = selected.map((s) => s.guardianPhone).join(",");
    const msg = getMessageForStudent(selected[0]);
    const url = `sms:${phones}?body=${encodeURIComponent(msg)}`;
    window.open(url, "_self");
    addToLog(
      MESSAGE_TYPES.find((m) => m.value === messageType)?.label ?? messageType,
      selected.length,
      getPreviewMessage(),
      "SMS"
    );
    toast({ title: "SMS app opened", description: `${selected.length} recipient(s) loaded in your SMS app.` });
  }

  function copyNumbers() {
    const selected = filteredStudents.filter((s) => selectedIds.has(s.id));
    if (selected.length === 0) {
      toast({ title: "No students selected", variant: "destructive" });
      return;
    }
    const numbers = selected.map((s) => s.guardianPhone).join("\n");
    navigator.clipboard.writeText(numbers);
    toast({ title: `${selected.length} number(s) copied`, description: "Paste into any messaging or broadcast app." });
  }

  function copyMessage() {
    const msg = getPreviewMessage();
    navigator.clipboard.writeText(msg);
    toast({ title: "Message copied to clipboard" });
  }

  function clearLog() {
    setLog([]);
    localStorage.removeItem(LOG_KEY);
    toast({ title: "Notification log cleared" });
  }

  const selectedCount = filteredStudents.filter((s) => selectedIds.has(s.id)).length;
  const className = (id: string) => classes.find((c) => c.id === id)?.name ?? id;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">Send attendance and results alerts to guardians via WhatsApp or SMS</p>
        </div>
        <Badge variant="outline" className="text-base px-4 py-2">
          {selectedCount} selected
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Recipient Selection */}
        <div className="lg:col-span-1 space-y-4">
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Recipients</h2>

            {/* Class filter */}
            <Select value={selectedClass} onValueChange={(v) => { setSelectedClass(v); setSelectedIds(new Set()); }}>
              <SelectTrigger data-testid="select-class">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Select all */}
            <button
              data-testid="button-select-all"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 text-sm font-medium w-full px-2 py-1 rounded hover:bg-muted transition-colors"
            >
              {allSelected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
              {allSelected ? "Deselect All" : "Select All"} ({filteredStudents.length})
            </button>

            {/* Student list */}
            <div className="space-y-1 max-h-[420px] overflow-y-auto pr-1">
              {filteredStudents.length === 0 && (
                <p className="text-sm text-muted-foreground py-4 text-center">No students found.</p>
              )}
              {filteredStudents.map((student) => {
                const selected = selectedIds.has(student.id);
                return (
                  <button
                    key={student.id}
                    data-testid={`student-row-${student.id}`}
                    onClick={() => toggleStudent(student.id)}
                    className={`w-full flex items-start gap-3 px-3 py-2 rounded-md text-left transition-colors ${selected ? "bg-primary/10 border border-primary/30" : "hover:bg-muted"}`}
                  >
                    {selected
                      ? <CheckSquare className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      : <Square className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />}
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-muted-foreground truncate">{className(student.classId)} &middot; {student.guardianPhone}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Message Composer */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border bg-card p-4 space-y-4">
            <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Message</h2>

            <Select value={messageType} onValueChange={setMessageType}>
              <SelectTrigger data-testid="select-message-type">
                <SelectValue placeholder="Choose message type" />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Preview */}
            <div className="rounded-md bg-muted/50 border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preview</span>
                <Button variant="ghost" size="sm" onClick={copyMessage} className="h-7 gap-1 text-xs">
                  <Copy className="w-3 h-3" /> Copy
                </Button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{getPreviewMessage()}</p>
            </div>

            {messageType === "custom" && (
              <Textarea
                data-testid="input-custom-message"
                placeholder="Type your custom message here... Use {guardian}, {student}, {class} as placeholders if needed."
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={5}
              />
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                data-testid="button-send-whatsapp"
                onClick={sendWhatsApp}
                disabled={selectedCount === 0}
                className="gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <MessageSquare className="w-4 h-4" />
                Send via WhatsApp
                {selectedCount > 0 && <Badge variant="secondary" className="ml-1 bg-green-500/30 text-white">{selectedCount}</Badge>}
              </Button>
              <Button
                data-testid="button-send-sms"
                onClick={sendSMS}
                disabled={selectedCount === 0}
                variant="outline"
                className="gap-2"
              >
                <Phone className="w-4 h-4" />
                Open in SMS App
              </Button>
              <Button
                data-testid="button-copy-numbers"
                onClick={copyNumbers}
                disabled={selectedCount === 0}
                variant="outline"
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Phone Numbers
              </Button>
              <Button
                data-testid="button-copy-message"
                onClick={copyMessage}
                variant="outline"
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copy Message Text
              </Button>
            </div>

            {/* How it works info */}
            <div className="rounded-md bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 space-y-1">
              <p className="text-xs font-semibold text-blue-800 dark:text-blue-300">How it works</p>
              <ul className="text-xs text-blue-700 dark:text-blue-400 space-y-0.5 list-disc list-inside">
                <li><strong>WhatsApp</strong> — opens a pre-filled chat for each guardian in a new tab</li>
                <li><strong>SMS App</strong> — opens your device SMS app with all numbers and message pre-filled</li>
                <li><strong>Copy Numbers</strong> — paste into any broadcast app or contact list</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Log */}
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground flex items-center gap-2">
            <Bell className="w-4 h-4" /> Notification Log
          </h2>
          {log.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearLog} className="h-7 gap-1 text-xs text-muted-foreground hover:text-destructive">
              <Trash2 className="w-3 h-3" /> Clear
            </Button>
          )}
        </div>

        {log.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No notifications sent yet. Your sent messages will appear here.</p>
        ) : (
          <div className="space-y-2">
            {log.map((entry) => (
              <div key={entry.id} data-testid={`log-entry-${entry.id}`} className="flex items-start gap-3 p-3 rounded-md bg-muted/40 border">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${entry.channel === "WhatsApp" ? "bg-green-500" : "bg-blue-500"}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium">{entry.type}</span>
                    <Badge variant="outline" className="text-xs">{entry.channel}</Badge>
                    <Badge variant="secondary" className="text-xs">{entry.recipients} recipient{entry.recipients !== 1 ? "s" : ""}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{entry.message}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">
                    {new Date(entry.timestamp).toLocaleString("en-GB")}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
