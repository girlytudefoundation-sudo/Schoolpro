import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, Users, BookOpen, User, Layers, GraduationCap, BarChart, Settings, Home, FileText, Calendar, LayoutGrid, BadgeCheck, Bell, Banknote } from "lucide-react";
import { Button } from "./ui/button";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/students", label: "Students", icon: Users },
  { path: "/staff", label: "Staff", icon: User },
  { path: "/classes", label: "Classes", icon: Layers },
  { path: "/subjects", label: "Subjects", icon: BookOpen },
  { path: "/results", label: "Results", icon: GraduationCap },
  { path: "/report-cards", label: "Report Cards", icon: FileText },
  { path: "/broadsheet", label: "Broadsheet", icon: LayoutGrid },
  { path: "/attendance", label: "Attendance", icon: Calendar },
  { path: "/id-cards", label: "ID Cards", icon: User },
  { path: "/certificates", label: "Certificates", icon: BadgeCheck },
  { path: "/analytics", label: "Analytics", icon: BarChart },
  { path: "/fees", label: "Fees", icon: Banknote },
  { path: "/notifications", label: "Notifications", icon: Bell },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
          <h1 className="text-xl font-bold font-serif">SchoolPro</h1>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${location === item.path ? "bg-sidebar-accent text-sidebar-accent-foreground" : "hover:bg-sidebar-accent/50"}`}>
                  <item.icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </a>
              </Link>
            ))}
          </nav>
        </div>
        <div className="p-4 border-t border-sidebar-border">
          <div className="mb-4">
            <p className="font-medium text-sm">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/70">{user.role}</p>
          </div>
          <Button variant="secondary" className="w-full justify-start gap-2" onClick={logout}>
            <LogOut className="w-4 h-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto flex flex-col">
        <div className="flex-1 p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
