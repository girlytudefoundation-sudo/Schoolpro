import { useState, useEffect } from "react";
import { getSettings, initDb, SchoolDB } from "../lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { Textarea } from "../components/ui/textarea";
import { IDBPDatabase } from "idb";

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [syncToken, setSyncToken] = useState("");

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const db = await initDb();
      await db.put("settings", settings);
      toast({ title: "Settings saved successfully" });
    } catch (error) {
      toast({ title: "Error saving settings", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    try {
      const db = await initDb();
      const exportObj: any = {};
      const storeNames = Array.from(db.objectStoreNames) as (keyof SchoolDB)[];
      
      for (const storeName of storeNames) {
        exportObj[storeName] = await db.getAll(storeName);
      }
      
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportObj));
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "schoolpro_backup.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      toast({ title: "Data exported successfully" });
    } catch (e) {
      toast({ title: "Export failed", variant: "destructive" });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target?.result as string);
        const db = await initDb();
        const storeNames = Array.from(db.objectStoreNames) as (keyof SchoolDB)[];
        
        const tx = db.transaction(storeNames, "readwrite");
        
        for (const storeName of storeNames) {
          if (importedData[storeName]) {
            const store = tx.objectStore(storeName);
            await store.clear();
            for (const item of importedData[storeName]) {
              await store.put(item);
            }
          }
        }
        await tx.done;
        toast({ title: "Data imported successfully. Please refresh the page." });
        setTimeout(() => window.location.reload(), 1500);
      } catch (err) {
        toast({ title: "Invalid backup file", variant: "destructive" });
      }
    };
    reader.readAsText(file);
  };

  const clearData = async () => {
    if (!confirm("Are you sure you want to clear ALL data? This cannot be undone.")) return;
    try {
      const db = await initDb();
      const storeNames = Array.from(db.objectStoreNames) as (keyof SchoolDB)[];
      const tx = db.transaction(storeNames, "readwrite");
      for (const storeName of storeNames) {
         await tx.objectStore(storeName).clear();
      }
      await tx.done;
      toast({ title: "All data cleared." });
      window.location.reload();
    } catch (e) {
      toast({ title: "Error clearing data", variant: "destructive" });
    }
  };

  if (!settings) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold font-serif">Settings</h2>
      
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>School Information</CardTitle>
            <CardDescription>Basic details about the school.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>School Name</Label>
              <Input name="schoolName" value={settings.schoolName} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea name="address" value={settings.address} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input name="phone" value={settings.phone} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Motto</Label>
              <Input name="motto" value={settings.motto} onChange={handleChange} />
            </div>
            <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Settings"}</Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Session Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Current Academic Session</Label>
                <Input name="currentSession" value={settings.currentSession} onChange={handleChange} placeholder="e.g. 2024/2025" />
              </div>
              <div className="space-y-2">
                <Label>Current Term</Label>
                <Input name="currentTerm" value={settings.currentTerm} onChange={handleChange} placeholder="e.g. 1st, 2nd, 3rd" />
              </div>
              <Button onClick={handleSave} disabled={saving}>{saving ? "Saving..." : "Save Session"}</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Data Management & Sync</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                <Button onClick={exportData} variant="outline" className="w-full justify-start">Export Backup (JSON)</Button>
                <div className="flex items-center gap-2">
                  <Input type="file" accept=".json" onChange={handleImport} className="w-full" />
                </div>
              </div>
              <div className="pt-4 mt-4 border-t border-border">
                <Button onClick={clearData} variant="destructive" className="w-full">Clear All Data</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
