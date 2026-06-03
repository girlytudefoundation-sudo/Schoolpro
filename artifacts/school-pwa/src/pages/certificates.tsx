import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Printer } from "lucide-react";

export default function Certificates() {
  const [type, setType] = useState("merit");
  const [name, setName] = useState("John Doe");
  const [reason, setReason] = useState("Academic Excellence");
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center print:hidden">
        <h2 className="text-2xl font-bold font-serif">Certificates</h2>
        <Button onClick={() => window.print()} className="gap-2"><Printer className="w-4 h-4"/> Print</Button>
      </div>

      <Card className="print:hidden">
        <CardHeader>
          <CardTitle>Certificate Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="merit">Certificate of Merit</SelectItem>
                <SelectItem value="graduation">Certificate of Graduation</SelectItem>
                <SelectItem value="participation">Certificate of Participation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Student Name</Label>
            <Input value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Reason / Achievement</Label>
            <Input value={reason} onChange={e => setReason(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <div className="bg-white text-black w-full aspect-[1.414/1] border-[12px] border-primary/20 rounded p-12 flex flex-col items-center justify-center text-center shadow-xl mx-auto max-w-5xl print:shadow-none print:border-[16px] print:w-[11in] print:h-[8.5in] print:m-0 print:absolute print:top-0 print:left-0">
        <div className="border-[4px] border-primary/40 w-full h-full p-12 flex flex-col items-center justify-center relative">
          <h1 className="text-6xl font-serif font-bold text-primary mb-2 uppercase tracking-widest">Certificate</h1>
          <h2 className="text-2xl font-serif tracking-widest uppercase text-muted-foreground mb-12">of {type}</h2>
          
          <p className="text-lg italic mb-6">This is proudly presented to</p>
          
          <h3 className="text-5xl font-bold font-serif mb-6 border-b-2 border-primary pb-2 px-12">{name || "Student Name"}</h3>
          
          <p className="text-lg mb-4">in recognition of</p>
          <p className="text-2xl font-medium font-serif max-w-2xl">{reason || "Achievement"}</p>
          
          <div className="absolute bottom-12 w-full px-24 flex justify-between items-end">
            <div className="text-center w-64">
              <p className="font-serif font-medium border-b border-black pb-1 mb-2">{date}</p>
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Date</p>
            </div>
            <div className="text-center w-64">
              <p className="font-serif font-medium border-b border-black pb-1 mb-2"></p>
              <p className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Principal Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
