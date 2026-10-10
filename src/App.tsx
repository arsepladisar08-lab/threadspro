/**
 * AutoThreads App Root
 * Responsive Layout (Mobile, Tablet, Desktop) with Minimalist shadcn/ui Standards
 */

import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { BottomNav } from "./components/BottomNav";
import { MobileDrawer } from "./components/MobileDrawer";
import { UserGuideModal } from "./components/UserGuideModal";
import { CommandPalette } from "./components/CommandPalette";
import { GeneratorPage } from "./pages/GeneratorPage";
import { LinkLabPage } from "./pages/LinkLabPage";
import { CalendarPage } from "./pages/CalendarPage";
import { CheckerPage } from "./pages/CheckerPage";
import { ReplyPage } from "./pages/ReplyPage";
import { ReviewPage } from "./pages/ReviewPage";
import { MetricsPage } from "./pages/MetricsPage";
import { BankPage } from "./pages/BankPage";
import { ProfilePage } from "./pages/ProfilePage";
import { AuthCallbackPage } from "./pages/AuthCallbackPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { storage } from "./lib/storage";
import { UserProfile } from "./types";
import { useTheme } from "./hooks/useTheme";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

function PageSpinner() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[50vh]" role="status" aria-label="Memuat">
      <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

/** Layout route: semua rute anak hanya bisa diakses setelah onboarding selesai. */
function ProtectedLayout({ isOnboarded }: { isOnboarded: boolean | null }) {
  if (isOnboarded === null) return <PageSpinner />;
  if (!isOnboarded) return <Navigate to="/onboarding" replace />;
  return <Outlet />;
}

function AppContent() {
  useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  // Default collapsed/hidden on tablet & desktop as required
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = localStorage.getItem("autothreads_sidebar_collapsed");
    return saved !== null ? saved === "true" : true;
  });
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
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

  // Keyboard Shortcuts Global Engine (⌘B, ⌘K, ?, Alt+1..5, Esc)
  useKeyboardShortcuts({
    onToggleSidebar: handleToggleSidebar,
    onOpenCommandPalette: () => setIsCommandPaletteOpen(true),
    onOpenGuide: () => setIsGuideOpen(true),
    onCloseModals: () => {
      setIsCommandPaletteOpen(false);
      setIsGuideOpen(false);
      setIsMobileDrawerOpen(false);
    },
  });

  const isOnboardingRoute = location.pathname === "/onboarding";

  // Mode rute Onboarding: tampilan terfokus tanpa distraksi navigasi
  if (isOnboardingRoute) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={handleToggleSidebar}
        onOpenGuide={() => setIsGuideOpen(true)}
        onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Work Area with Sidebar for Desktop */}
      <div className="flex-1 flex w-full min-h-[calc(100vh-3.5rem)]">
        {/* Toggleable Collapsed Sidebar (Desktop) */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          profile={profile}
        />

        {/* Dynamic Route Content */}
        <main className="flex-1 min-w-0 w-full overflow-x-hidden pb-20 lg:pb-8">
          <Routes>
            {/* Rute yang memerlukan onboarding selesai */}
            <Route element={<ProtectedLayout isOnboarded={isOnboarded} />}>
              <Route path="/" element={<GeneratorPage />} />
              <Route path="/link" element={<LinkLabPage />} />
              <Route path="/kalender" element={<CalendarPage />} />
              <Route path="/cek" element={<CheckerPage />} />
              <Route path="/balas" element={<ReplyPage />} />
              <Route path="/ulas" element={<ReviewPage />} />
              <Route path="/metrik" element={<MetricsPage />} />
              <Route path="/bank" element={<BankPage />} />
              <Route path="/admin/bank" element={<Navigate to="/bank" replace />} />
            </Route>

            {/* Rute publik */}
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />

            {/* Alias lama dialihkan ke rute kanonis */}
            <Route path="/generator" element={<Navigate to="/" replace />} />
            {["/settings", "/pengaturan", "/api-lab", "/admin/api-lab", "/api-key", "/gemini"].map((path) => (
              <Route key={path} path={path} element={<Navigate to="/profil" replace />} />
            ))}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Mobile Touch-Friendly Bottom Bar */}
      <BottomNav />

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

      {/* Global Command Palette (⌘+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onToggleSidebar={handleToggleSidebar}
        onOpenGuide={() => {
          setIsCommandPaletteOpen(false);
          setIsGuideOpen(true);
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
