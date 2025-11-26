import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { TopNav } from "@/components/layout/TopNav";
import { BottomNav } from "@/components/layout/BottomNav";
import { Dashboard } from "./pages/Dashboard";
import { Login } from "./pages/Login";
import { Signup } from "./pages/Signup";
import { ForYou } from "./pages/ForYou";
import { MyEvents } from "./pages/MyEvents";
import { ODApprovals } from "./pages/ODApprovals";
import { Profile } from "./pages/Profile";
import NotFound from "./pages/NotFound";
import { EventDetailsPage } from "./pages/EventDetailsPage";
import { CheckInScanner } from "./pages/CheckInScanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
          <div className="min-h-screen bg-background">
            <TopNav />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/for-you" element={<ForYou />} />
              <Route path="/my-events" element={<MyEvents />} />
              <Route path="/od-approvals" element={<ODApprovals />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/event/:eventId" element={<EventDetailsPage />} />
              <Route path="/check-in" element={<CheckInScanner />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </div>
        </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
