import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

export default function Login() {
  const { login, user } = useAuth();
  const [, setLocation] = useLocation();
  const [role, setRole] = useState("admin");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  if (user) {
    setLocation("/dashboard");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const success = await login(role, pin);
    if (success) {
      setLocation("/dashboard");
    } else {
      setError("Invalid PIN or Role.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/20">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-serif font-bold text-primary tracking-tight">SchoolPro</h1>
        <p className="text-muted-foreground mt-2 font-medium">Command Center</p>
      </div>

      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-2xl">Secure Login</CardTitle>
          <CardDescription>Enter your credentials to access the system.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label>Role</Label>
              <div className="grid grid-cols-3 gap-2">
                {["Admin", "Teacher", "Principal"].map((r) => (
                  <Button
                    key={r}
                    type="button"
                    variant={role === r.toLowerCase() ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setRole(r.toLowerCase())}
                  >
                    {r}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="pin">PIN</Label>
              <Input
                id="pin"
                type="password"
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="text-center text-xl tracking-[0.5em] font-mono h-12"
                maxLength={4}
              />
            </div>

            {error && <p className="text-destructive text-sm text-center font-medium">{error}</p>}

            <Button type="submit" className="w-full h-12 text-lg">
              Access Dashboard
            </Button>
          </form>

          <div className="mt-8 p-4 bg-muted rounded-md text-xs text-muted-foreground text-center space-y-1">
            <p className="font-semibold text-foreground mb-2">Default Credentials</p>
            <p>Admin: <span className="font-mono bg-background px-1 rounded">0000</span></p>
            <p>Teacher: <span className="font-mono bg-background px-1 rounded">1234</span></p>
            <p>Principal: <span className="font-mono bg-background px-1 rounded">5678</span></p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
