import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import LiveMonitoring from "./pages/LiveMonitoring";
import AttendanceHistory from "./pages/AttendanceHistory";
import Users from "./pages/Users";
import Departments from "./pages/Departments";
import Roles from "./pages/Roles";
import Analytics from "./pages/Analytics";
import SystemHealth from "./pages/SystemHealth";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const router = createBrowserRouter(
  [
    { path: "/auth", element: <Auth /> },
    { path: "/", element: <ProtectedRoute><Dashboard /></ProtectedRoute> },
    { path: "/live", element: <ProtectedRoute><LiveMonitoring /></ProtectedRoute> },
    { path: "/attendance", element: <ProtectedRoute><AttendanceHistory /></ProtectedRoute> },
    { path: "/users", element: <ProtectedRoute><Users /></ProtectedRoute> },
    { path: "/departments", element: <ProtectedRoute><Departments /></ProtectedRoute> },
    { path: "/roles", element: <ProtectedRoute><Roles /></ProtectedRoute> },
    { path: "/analytics", element: <ProtectedRoute><Analytics /></ProtectedRoute> },
    { path: "/system", element: <ProtectedRoute><SystemHealth /></ProtectedRoute> },
    { path: "/settings", element: <ProtectedRoute><Settings /></ProtectedRoute> },
    // ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE
    { path: "*", element: <NotFound /> },
  ],
  {
    // Opt-in to v7 future behaviors to avoid warnings about upcoming changes
    // cast to any because the TS types may not include the newest future flags yet
    future: ({ v7_startTransition: true, v7_relativeSplatPath: true } as any),
  }
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <RouterProvider router={router} />
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
