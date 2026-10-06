/**
 * AutoThreads App Root
 * Routing & Mobile-first Layout
 */

import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Navbar } from "./components/Navbar";
import { BottomNav } from "./components/BottomNav";
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

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans antialiased selection:bg-indigo-500 selection:text-white">
        {/* Navigation Bar */}
        <Navbar />

        {/* Main Content Area */}
        <main className="flex-1 w-full">
          <Routes>
            <Route path="/" element={<GeneratorPage />} />
            <Route path="/generator" element={<Navigate to="/" replace />} />
            <Route path="/kalender" element={<CalendarPage />} />
            <Route path="/cek" element={<CheckerPage />} />
            <Route path="/balas" element={<ReplyPage />} />
            <Route path="/ulas" element={<ReviewPage />} />
            <Route path="/metrik" element={<MetricsPage />} />
            <Route path="/bank" element={<BankPage />} />
            <Route path="/admin/bank" element={<BankPage />} />
            <Route path="/profil" element={<ProfilePage />} />
            <Route path="/admin/api-lab" element={<ThreadsApiLabPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Bottom Nav for Mobile Devices (360px ready) */}
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}
