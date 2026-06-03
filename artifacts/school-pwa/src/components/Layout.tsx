import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "../contexts/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  LogOut, Users, BookOpen, User, Layers, GraduationCap, BarChart,
  Settings, Home, FileText, Calendar, LayoutGrid, BadgeCheck, Bell,
  Banknote, ArrowUpCircle, Clock, ClipboardList, Sun, Moon,
} from "lucide-react";
import { Button } from "./ui/button";

const navItems = [
  { path: "/dashboard",      label: "Dashboard",       icon: Home },
  { path: "/students",       label: "Students",         icon: Users },
  { path: "/staff",          label: "Staff",            icon: User },
  { path: "/classes",        label: "Classes",          icon: Layers },
  { path: "/subjects",       label: "Subjects",         icon: BookOpen },
  { path: "/results",        label: "Results",          icon: GraduationCap },
  { path: "/report-cards",   label: "Report Cards",     icon: FileText },
  { path: "/broadsheet",     label: "Broadsheet",       icon: LayoutGrid },
  { path: "/attendance",     label: "Attendance",       icon: Calendar },
  { path: "/timetable",      label: "Timetable",        icon: Clock },
  { path: "/exam-timetable", label: "Exam Timetable",   icon: ClipboardList },
  { path: "/promotion",      label: "Promotion",        icon: ArrowUpCircle },
  { path: "/id-cards",       label: "ID Cards",         icon: BadgeCheck },
  { path: "/certificates",   label: "Certificates",     icon: BadgeCheck },
  { path: "/analytics",      label: "Analytics",        icon: BarChart },
  { path: "/fees",           label: "Fees",             icon: Banknote },
  { path: "/notifications",  label: "Notifications",    icon: Bell },
  { path: "/settings",       label: "Settings",         icon: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();

  if (!user) return null;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 bg-sidebar border-r border-sidebar-border text-sidebar-foreground flex flex-col shrink-0">
        {/* Logo + theme toggle */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border">
          <h1 className="text-lg font-bold font-serif">SchoolPro</h1>
          <button
            data-testid="button-theme-toggle"
            onClick={toggleTheme}
            className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-sidebar-accent/60 transition-colors"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark"
              ? <Sun className="w-4 h-4 text-amber-300" />
              : <Moon className="w-4 h-4 text-sidebar-foreground/70" />}
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-3">
          <nav className="space-y-0.5 px-2">
            {navItems.map((item) => {
              const active = location === item.path;
              return (
                <Link key={item.path} href={item.path}>
                  <a
                    className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors ${
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                        : "hover:bg-sidebar-accent/50 text-sidebar-foreground/80"
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </a>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-sidebar-border space-y-2">
          <div>
            <p className="font-medium text-sm truncate">{user.name}</p>
            <p className="text-xs text-sidebar-foreground/60">{user.role}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="w-full justify-start gap-2 text-xs"
            onClick={logout}
          >
            <LogOut className="w-3.5 h-3.5" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto w-full min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
