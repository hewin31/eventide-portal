import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import ClubWorkspace from "./pages/ClubWorkspace";
import CreateEvent from "./pages/CreateEvent";
import EditClub from "./pages/EditClub";
import AllEvents from "./pages/AllEvents";
import EditEvent from "./pages/EditEvent";
import EventManagement from "./pages/EventManagement";
import Profile from "./pages/Profile";
import EventApprovalsPage from "./pages/EventApprovalsPage";
import ODManagementPage from "./pages/ODManagementPage";
import AdminDashboard from "./pages/AdminDashboard"; // Import the new admin page
import CoordinatorManagement from "./pages/CoordinatorManagement";
import UserManagement from "./pages/UserManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Default redirect based on role */}
      <Route path="/" element={<Navigate to={user ? (user.role === 'admin' ? '/admin/clubs' : '/dashboard') : '/login'} replace />} />

      {/* Auth routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student', 'member', 'coordinator', 'faculty']}>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/events"
        element={
          <ProtectedRoute>
            <AllEvents />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/clubs"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/coordinators"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <CoordinatorManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <UserManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/club/:clubId"
        element={
          <ProtectedRoute>
            <ClubWorkspace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/club/:clubId/create-event"
        element={
          <ProtectedRoute>
            <CreateEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/club/:clubId/edit"
        element={
          <ProtectedRoute>
            <EditClub />
          </ProtectedRoute>
        }
      />
      <Route
        path="/club/:clubId/event/:eventId/edit"
        element={
          <ProtectedRoute>
            <EditEvent />
          </ProtectedRoute>
        }
      />
      <Route
        path="/club/:clubId/event/:eventId"
        element={
          <ProtectedRoute>
            <EventManagement />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals/events"
        element={
          <ProtectedRoute allowedRoles={['coordinator']}>
            <EventApprovalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/approvals/od"
        element={
          <ProtectedRoute allowedRoles={['coordinator']}>
            <ODManagementPage />
          </ProtectedRoute>
        }
      />

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
