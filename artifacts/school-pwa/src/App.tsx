import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Layout } from "./components/Layout";

import Login from "./pages/login";
import Dashboard from "./pages/dashboard";
import Students from "./pages/students";
import Staff from "./pages/staff";
import Classes from "./pages/classes";
import Subjects from "./pages/subjects";
import Results from "./pages/results";
import ReportCards from "./pages/report-cards";
import Broadsheet from "./pages/broadsheet";
import Attendance from "./pages/attendance";
import IdCards from "./pages/id-cards";
import Certificates from "./pages/certificates";
import Analytics from "./pages/analytics";
import Settings from "./pages/settings";
import Notifications from "./pages/notifications";

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component, ...rest }: any) {
  const { user, isLoading } = useAuth();
  if (isLoading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!user) return <Redirect to="/login" />;
  
  return (
    <Layout>
      <Component />
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Redirect to="/dashboard" />} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard" component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path="/students" component={() => <ProtectedRoute component={Students} />} />
      <Route path="/staff" component={() => <ProtectedRoute component={Staff} />} />
      <Route path="/classes" component={() => <ProtectedRoute component={Classes} />} />
      <Route path="/subjects" component={() => <ProtectedRoute component={Subjects} />} />
      <Route path="/results" component={() => <ProtectedRoute component={Results} />} />
      <Route path="/report-cards" component={() => <ProtectedRoute component={ReportCards} />} />
      <Route path="/broadsheet" component={() => <ProtectedRoute component={Broadsheet} />} />
      <Route path="/attendance" component={() => <ProtectedRoute component={Attendance} />} />
      <Route path="/id-cards" component={() => <ProtectedRoute component={IdCards} />} />
      <Route path="/certificates" component={() => <ProtectedRoute component={Certificates} />} />
      <Route path="/analytics" component={() => <ProtectedRoute component={Analytics} />} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/notifications" component={() => <ProtectedRoute component={Notifications} />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
