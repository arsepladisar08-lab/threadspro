/**
 * AutoThreads App Root
 * Responsive Layout (Mobile, Tablet, Desktop) with Minimalist shadcn/ui Standards
 */

import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { BottomNav } from "./components/BottomNav";
import { MobileDrawer } from "./components/MobileDrawer";
import { UserGuideModal } from "./components/UserGuideModal";
import { GeneratorPage } from "./pages/GeneratorPage";
import { CalendarPage } from "./pages/CalendarPage";
import { CheckerPage } from "./pages/CheckerPage";
import { ReplyPage } from "./pages/ReplyPage";
import { ReviewPage } from "./pages/ReviewPage";
import { MetricsPage } from "./pages/MetricsPage";
import { BankPage } from "./pages/BankPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ThreadsApiLabPage } from "./pages/ThreadsApiLabPage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { storage } from "./lib/storage";
import { UserProfile } from "./types";

interface ProtectedRouteProps {
  isOnboarded: boolean | null;
  children: React.ReactElement;
}

function ProtectedRoute({ isOnboarded, children }: ProtectedRouteProps) {
  if (isOnboarded === null) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
}

function AppContent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  // Default collapsed/hidden on tablet & desktop as required
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("autothreads_sidebar_collapsed");
    return saved !== null ? saved === "true" : true;
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const checkOnboardingStatus = async () => {
    const completed = await storage.isOnboardingCompleted();
    const account = await storage.getThreadsAccount();
    setIsOnboarded(Boolean(completed || account));
  };

  useEffect(() => {
    checkOnboardingStatus();
    storage.getProfile().then(setProfile);
  }, [location.pathname]);

  useEffect(() => {
    const handleOnboardingChange = () => {
      checkOnboardingStatus();
    };
    window.addEventListener("autothreads_onboarding_changed", handleOnboardingChange);
    return () => window.removeEventListener("autothreads_onboarding_changed", handleOnboardingChange);
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("autothreads_sidebar_collapsed", String(next));
      return next;
    });
  };

  // Global shortcut '?' untuk membuka panduan interaktif
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Abaikan jika sedang mengetik di input atau textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setIsGuideOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const isOnboardingRoute = location.pathname === "/onboarding";

  // Mode rute Onboarding: tampilan terfokus tanpa distraksi navigasi
  if (isOnboardingRoute) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
      />

      {/* Main Work Area with Sidebar for Desktop */}
      <div className="flex-1 flex w-full min-h-[calc(100vh-4rem)]">
        {/* Toggleable Collapsed Sidebar (Desktop) */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebar}
          onOpenGuide={() => setIsGuideOpen(true)}
          profile={profile}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 min-w-0 w-full overflow-x-hidden pb-20 lg:pb-8">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute isOnboarded={isOnboarded}>
                  <GeneratorPage />
                </ProtectedRoute>
              }
            />
            <Route path="/generator" element={<Navigate to="/" replace />} />
            <Route
              path="/kalender"
              element={
                <ProtectedRoute isOnboarded={isOnboarded}>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cek"
              element={
                <ProtectedRoute isOnboarded={isOnboarded}>
                  <CheckerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/balas"
              element={
                <ProtectedRoute isOnboarded={isOnboarded}>
                  <ReplyPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ulas"
              element={
                <ProtectedRoute isOnboarded={isOnboarded}>
                  <ReviewPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/metrik"
              element={
                <ProtectedRoute isOnboarded={isOnboarded}>
                  <MetricsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/bank"
              element={
                <ProtectedRoute isOnboarded={isOnboarded}>
                  <BankPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bank"
              element={
                <ProtectedRoute isOnboarded={isOnboarded}>
                  <BankPage />
                </ProtectedRoute>
              }
            />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="/admin/api-lab" element={<ThreadsApiLabPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Touch-Friendly Bottom Bar */}
      <BottomNav onOpenMenu={() => setIsMobileDrawerOpen(true)} />

      {/* Mobile Touch-Friendly Slide Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        onOpenGuide={() => setIsGuideOpen(true)}
        profile={profile}
      />

      {/* Interactive Floating User Guide Dialog */}
      <UserGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        onSelectAction={(path) => {
          navigate(path);
          setIsGuideOpen(false);
        }}
      />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
