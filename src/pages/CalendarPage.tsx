import React, { useState, useEffect } from "react";
import { CalendarDayItem, GoalType, UserProfile, ScheduledThreadItem, TimeSlotType, VariantOutput } from "../types";
import { storage } from "../lib/storage";
import { generateJSON } from "../services/ai";
import { calculateNextPrimeTime, formatWibDateTime } from "../lib/wibHelper";
import { ScheduledQueueList } from "../components/ScheduledQueueList";
import {
  Calendar,
  Download,
  Sparkles,
  RefreshCw,
  Clock,
  Tag,
  MessageCircle,
  Check,
  ArrowRight,
  Send,
  Plus,
  AlertCircle,
  CheckCircle2,
  X,
} from "lucide-react";

export const CalendarPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<"calendar" | "queue">("calendar");
  const [durationDays, setDurationDays] = useState<7 | 14>(7);
  const [modeFormula, setModeFormula] = useState<"umum" | "hub">("umum");
  const [calendarDays, setCalendarDays] = useState<CalendarDayItem[]>([]);
  const [queueCount, setQueueCount] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [weeklyTheme, setWeeklyTheme] = useState("");
  const [summaryRationale, setSummaryRationale] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toastNotice, setToastNotice] = useState<string | null>(null);

  // Quick schedule modal state
  const [schedulingDay, setSchedulingDay] = useState<CalendarDayItem | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlotType>("malam");
  const [customDraftText, setCustomDraftText] = useState("");
  const [daysOffset, setDaysOffset] = useState<number>(0);

  useEffect(() => {
    storage.getProfile().then((p) => {
      if (p) {
        setProfile(p);
        if (p.modePreference) setModeFormula(p.modePreference);
      }
    });

    storage.getCalendar().then((items) => {
      if (items && items.length > 0) {
        setCalendarDays(items);
      } else {
        generateDefaultPlan(7, "umum");
      }
    });

    updateQueueCount();
    const handleQueueChange = () => updateQueueCount();
    window.addEventListener("autothreads_queue_updated", handleQueueChange);
    return () => window.removeEventListener("autothreads_queue_updated", handleQueueChange);
  }, []);

  const updateQueueCount = async () => {
    const q = await storage.getScheduledQueue();
    const active = q.filter((i) => i.status === "queued").length;
    setQueueCount(active);
  };

  const generateDefaultPlan = (daysCount: number, mode: "umum" | "hub") => {
    const defaultUmum: CalendarDayItem[] = [
      {
        id: "d1",
        dayNumber: 1,
        dayName: "Senin",
        goal: "Jangkauan",
        pillar: "Pertanyaan Cemas Finansial",
        ideaPrompt: "Tanya warga soal pos pengeluaran yang paling sering bikin kaget di tanggal muda.",
        cardId: "K01",
        hookPattern: "K01-H5: [Dua pilihan relatable], tim mana?",
        format: "Polling diskusi santai",
        topicTag: "Keuangan Pribadi",
        timeWIB: "07.30 - 09.00 WIB",
        replyActionGoal: "Balas 12 akun sejenis di topik finansial",
        status: "planned",
      },
      {
        id: "d2",
        dayNumber: 2,
        dayName: "Selasa",
        goal: "Kedekatan",
        pillar: "Storytelling Pengalaman Boncos",
        ideaPrompt: "Cerita jujur pengalaman boncos beli barang karena FOMO diskon.",
        cardId: "K05",
        hookPattern: "K05-H3: Gue rugi [nominal] karena ikut [tren]...",
        format: "Thread 3 post + foto mutasi",
        topicTag: "Belajar Finansial",
        timeWIB: "19.30 - 22.30 WIB",
        replyActionGoal: "Balas 15 komentar warga dengan pertanyaan balik",
        status: "planned",
      },
      {
        id: "d3",
        dayNumber: 3,
        dayName: "Rabu",
        goal: "Jangkauan",
        pillar: "Reply Day & Networking",
        ideaPrompt: "Fokus bersilaturahmi dan memberikan komentar bermakna di 15 akun kreator lain.",
        cardId: "K03",
        hookPattern: "Observasi ringan perbedaan IG vs Threads",
        format: "1 post observasi pendek",
        topicTag: "Diskusi Santai",
        timeWIB: "12.00 - 13.30 WIB",
        replyActionGoal: "Target utama: 15 reply berkualitas tinggi di postingan orang lain",
        status: "planned",
      },
      {
        id: "d4",
        dayNumber: 4,
        dayName: "Kamis",
        goal: "Kedekatan",
        pillar: "Daftar Hal yang Berhenti Dilakukan",
        ideaPrompt: "5 kebiasaan finansial yang gue hentikan di umur 25 dan bikin hidup lebih tenang.",
        cardId: "K02",
        hookPattern: "K02-H1: Umur [usia], gue berhenti melakukan [N] hal ini...",
        format: "Listicle 5 poin brutal jujur",
        topicTag: "Self Improvement",
        timeWIB: "19.30 - 22.30 WIB",
        replyActionGoal: "Balas 10 quote repost warga",
        status: "planned",
      },
      {
        id: "d5",
        dayNumber: 5,
        dayName: "Jumat",
        goal: "Konversi",
        pillar: "Rumus Sistem Budgeting",
        ideaPrompt: "Alur pembagian gaji 3 pos sederhana tanpa ribet catat tiap rupiah.",
        cardId: "K01",
        hookPattern: "K01-H4: [Gaji], [beban], tapi bisa [hasil]. Alurnya:",
        format: "Thread 4 slide + link template di reply 2",
        topicTag: "Tips Finansial",
        timeWIB: "12.00 - 13.30 WIB",
        replyActionGoal: "Balas semua yang minta link di reply 2",
        status: "planned",
      },
      {
        id: "d6",
        dayNumber: 6,
        dayName: "Sabtu",
        goal: "Jangkauan",
        pillar: "Humor Relatable Weekend",
        ideaPrompt: "Meme teks belanja weekend vs realita saldo m-banking.",
        cardId: "K03",
        hookPattern: "K03-H1: Buka IG vs Buka Threads...",
        format: "Teks 1 baris punchline",
        topicTag: "Humor Warga",
        timeWIB: "19.30 - 22.30 WIB",
        replyActionGoal: "Balas komentar dengan nada bercanda",
        status: "planned",
      },
      {
        id: "d7",
        dayNumber: 7,
        dayName: "Minggu",
        goal: "Kedekatan",
        pillar: "Refleksi & Evaluasi Rasio",
        ideaPrompt: "Curhat santai persiapan minggu depan & cek rasio reply/like postingan seminggu.",
        cardId: "K04",
        hookPattern: "Curhat malam reflektif",
        format: "Pertanyaan terbuka validasi",
        topicTag: "Cerita Warga",
        timeWIB: "20.00 - 22.00 WIB",
        replyActionGoal: "Review angka reply/like di tracker",
        status: "planned",
      },
    ];

    setCalendarDays(defaultUmum);
    setWeeklyTheme("Membangun Kedekatan Emosional & Interaksi Aktif Warga");
    setSummaryRationale("Distribusi seimbang 40% Jangkauan, 40% Kedekatan, 20% Konversi sesuai standar Meta Threads ID.");
  };

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const output = await generateJSON("calendar", {
        niche: profile?.niche || "Keuangan",
        targetAudience: profile?.targetAudience || "Umum",
        tone: profile?.tone || "santai",
        formulaMode: modeFormula,
        durationDays,
      });

      if (output && output.days) {
        setCalendarDays(output.days);
        setWeeklyTheme(output.weeklyTheme || "");
        setSummaryRationale(output.summaryRationale || "");
        await storage.saveCalendar(output.days);
      }
    } catch (e: any) {
      console.error("Gagal generate kalender:", e);
      setErrorMessage(e.message || "Gagal membuat kalender via AI. Silakan coba lagi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportICS = () => {
    let icsContent = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//AutoThreads//ID\nCALSCALE:GREGORIAN\n";

    calendarDays.forEach((day, idx) => {
      const today = new Date();
      const eventDate = new Date(today.getTime() + idx * 86400000);
      const dateStr = eventDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

      icsContent += `BEGIN:VEVENT\nSUMMARY:[Threads] ${day.goal}: ${day.pillar}\nDESCRIPTION:${day.ideaPrompt}\\n\\nTopic Tag: ${day.topicTag}\\nTarget Reply: ${day.replyActionGoal}\nDTSTART:${dateStr}\nDTEND:${dateStr}\nSTATUS:CONFIRMED\nEND:VEVENT\n`;
    });

    icsContent += "END:VCALENDAR";

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `autothreads-kalender-${durationDays}hari.ics`;
    a.click();
  };

  const handleOpenScheduleModal = (day: CalendarDayItem) => {
    setSchedulingDay(day);
    // Tentukan default slot berdasarkan jam yang tertera pada kartu
    if (day.timeWIB.includes("07") || day.timeWIB.includes("08") || day.timeWIB.includes("09")) {
      setSelectedSlot("pagi");
    } else if (day.timeWIB.includes("12") || day.timeWIB.includes("13")) {
      setSelectedSlot("siang");
    } else {
      setSelectedSlot("malam");
    }
    setDaysOffset(day.dayNumber - 1);
    setCustomDraftText(day.ideaPrompt);
  };

  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedulingDay) return;

    const targetIso = calculateNextPrimeTime(selectedSlot, daysOffset);

    const variant: VariantOutput = {
      template: "scheduled_calendar_day",
      goal: schedulingDay.goal,
      fusion_trace: {
        card_id: schedulingDay.cardId || "K01",
        hook_id: "H1",
        pola_dipinjam: schedulingDay.pillar,
        perubahan_dari_ide_kasar: schedulingDay.ideaPrompt,
      },
      hooks: [schedulingDay.hookPattern],
      posts: [
        {
          order: 1,
          text: customDraftText.trim() || schedulingDay.ideaPrompt,
          char_count: (customDraftText.trim() || schedulingDay.ideaPrompt).length,
        },
      ],
      reply_2: {
        text: `Target interaksi: ${schedulingDay.replyActionGoal}`,
        contains_link: false,
      },
      topic_tag: schedulingDay.topicTag,
      closing_question: "Bagaimana tanggapan kalian?",
      best_time_wib: schedulingDay.timeWIB,
      first_30_min_plan: [schedulingDay.replyActionGoal],
      algorithm_signal: "Engagement Organik",
      signal_confidence: "R",
      placeholders_to_fill: [],
    };

    const item: ScheduledThreadItem = {
      id: `sched_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      variant,
      scheduledTimeISO: targetIso,
      timeSlot: selectedSlot,
      status: "queued",
      retryCount: 0,
      createdAt: Date.now(),
    };

    await storage.saveScheduledThread(item);
    setSchedulingDay(null);
    setToastNotice(`Berhasil dijadwalkan ke slot ${selectedSlot} (${formatWibDateTime(targetIso)})`);
    setTimeout(() => setToastNotice(null), 3500);
    updateQueueCount();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 space-y-6">
      {/* Calm Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3 border-b border-zinc-900 pb-5">
        <div>
          <h1 className="text-xl font-semibold text-zinc-100 tracking-tight">
            Kalender Konten & Antrean
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Rencana posting mingguan terstruktur & auto-scheduler eksekusi jam prime-time WIB.
          </p>
        </div>

        {/* Calm Segmented Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-850 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("calendar")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer ${
              activeTab === "calendar"
                ? "bg-zinc-800 text-zinc-100 font-semibold shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            Rencana Kalender ({durationDays} Hari)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === "queue"
                ? "bg-zinc-800 text-zinc-100 font-semibold shadow-xs"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <span>Antrean Terjadwal</span>
            {queueCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-zinc-700 text-zinc-200 text-[10px] flex items-center justify-center font-bold">
                {queueCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Toast Notice */}
      {toastNotice && (
        <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastNotice(null)}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-zinc-900 border border-rose-500/30 flex items-center justify-between text-xs text-rose-300">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tab 1: Calendar View */}
      {activeTab === "calendar" && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl border border-zinc-900 bg-zinc-900/20 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Duration buttons */}
              <div className="flex p-0.5 rounded-lg bg-zinc-950 border border-zinc-850">
                <button
                  type="button"
                  onClick={() => setDurationDays(7)}
                  className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                    durationDays === 7 ? "bg-zinc-800 text-zinc-100 font-medium" : "text-zinc-400"
                  }`}
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setDurationDays(14)}
                  className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                    durationDays === 14 ? "bg-zinc-800 text-zinc-100 font-medium" : "text-zinc-400"
                  }`}
                >
                  14 Hari
                </button>
              </div>

              {/* Mode preference */}
              <div className="flex p-0.5 rounded-lg bg-zinc-950 border border-zinc-850">
                <button
                  type="button"
                  onClick={() => setModeFormula("umum")}
                  className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                    modeFormula === "umum" ? "bg-zinc-800 text-zinc-100 font-medium" : "text-zinc-400"
                  }`}
                  title="Formula 40% Jangkauan, 40% Kedekatan, 20% Konversi"
                >
                  Umum (40/40/20)
                </button>
                <button
                  type="button"
                  onClick={() => setModeFormula("hub")}
                  className={`px-2.5 py-1 rounded text-xs transition cursor-pointer ${
                    modeFormula === "hub" ? "bg-zinc-800 text-zinc-100 font-medium" : "text-zinc-400"
                  }`}
                  title="Formula Hub Kreator"
                >
                  Hub Kreator
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportICS}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-300 border border-zinc-800 transition cursor-pointer text-xs"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span>Ekspor .ics</span>
              </button>

              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={isGenerating}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-white text-zinc-950 font-semibold transition cursor-pointer disabled:opacity-40 text-xs shadow-xs"
              >
                {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>Susun Ulang AI</span>
              </button>
            </div>
          </div>

          {/* Theme Banner */}
          {weeklyTheme && (
            <div className="p-4 rounded-2xl border border-zinc-900 bg-zinc-950/60 space-y-1 text-xs">
              <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                <span>TEMA MINGGU INI</span>
                <span>{modeFormula === "umum" ? "Standar Algoritma Threads ID" : "Formula Komunitas Hub"}</span>
              </div>
              <h2 className="text-sm font-semibold text-zinc-100">{weeklyTheme}</h2>
              {summaryRationale && <p className="text-zinc-400 leading-relaxed">{summaryRationale}</p>}
            </div>
          )}

          {/* Days Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {calendarDays.map((day, idx) => (
              <div
                key={day.id || idx}
                className="p-4 rounded-2xl border border-zinc-900 bg-zinc-900/20 hover:border-zinc-800 transition space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Card Header */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-zinc-900 border border-zinc-800 font-mono text-zinc-300 flex items-center justify-center font-semibold text-xs">
                        {day.dayNumber}
                      </span>
                      <span className="font-semibold text-zinc-100">{day.dayName}</span>
                    </div>

                    <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {day.goal}
                    </span>
                  </div>

                  {/* Pillar & Prompt */}
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-zinc-200 line-clamp-1">{day.pillar}</h3>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3">{day.ideaPrompt}</p>
                  </div>

                  {/* Hook pattern */}
                  <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-850 text-[11px] text-zinc-400 italic">
                    "{day.hookPattern}"
                  </div>

                  {/* Meta: Topic Tag & WIB Time */}
                  <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1">
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Tag className="w-3 h-3 text-zinc-400" />
                      <span>{day.topicTag}</span>
                    </span>
                    <span className="flex items-center gap-1 font-mono text-zinc-300">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      <span>{day.timeWIB}</span>
                    </span>
                  </div>

                  {/* Daily Reply Goal */}
                  <div className="pt-2 border-t border-zinc-900 flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <MessageCircle className="w-3 h-3 text-zinc-400 shrink-0" />
                    <span className="line-clamp-1">{day.replyActionGoal}</span>
                  </div>
                </div>

                {/* Card Action: Schedule */}
                <div className="pt-3 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => handleOpenScheduleModal(day)}
                    className="w-full py-1.5 px-3 rounded-lg bg-zinc-900 hover:bg-zinc-850 text-zinc-200 hover:text-white border border-zinc-800 transition text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Jadwalkan ke Antrean</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Queue Manager View */}
      {activeTab === "queue" && (
        <ScheduledQueueList
          onScheduleNew={() => {
            if (calendarDays[0]) handleOpenScheduleModal(calendarDays[0]);
          }}
        />
      )}

      {/* Quick Schedule Modal */}
      {schedulingDay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="relative w-full max-w-md p-5 bg-zinc-950 border border-zinc-850 rounded-2xl shadow-2xl text-left space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-900">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-zinc-400" />
                <h3 className="text-sm font-semibold text-zinc-100">
                  Jadwalkan: {schedulingDay.dayName} ({schedulingDay.pillar})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSchedulingDay(null)}
                className="text-zinc-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmSchedule} className="space-y-4 text-xs">
              {/* Draft Text Preview */}
              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Teks Draf Utas (Bisa Diubah):</label>
                <textarea
                  rows={3}
                  value={customDraftText}
                  onChange={(e) => setCustomDraftText(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-hidden leading-relaxed"
                  required
                />
              </div>

              {/* Offset Days Selection */}
              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Kapan Ditayangkan:</label>
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-zinc-900 border border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setDaysOffset(0)}
                    className={`py-1 rounded-lg text-xs transition ${
                      daysOffset === 0 ? "bg-zinc-800 text-zinc-100 font-semibold" : "text-zinc-400"
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setDaysOffset(1)}
                    className={`py-1 rounded-lg text-xs transition ${
                      daysOffset === 1 ? "bg-zinc-800 text-zinc-100 font-semibold" : "text-zinc-400"
                    }`}
                  >
                    Besok
                  </button>
                  <button
                    type="button"
                    onClick={() => setDaysOffset(2)}
                    className={`py-1 rounded-lg text-xs transition ${
                      daysOffset === 2 ? "bg-zinc-800 text-zinc-100 font-semibold" : "text-zinc-400"
                    }`}
                  >
                    Lusa
                  </button>
                  <button
                    type="button"
                    onClick={() => setDaysOffset(schedulingDay.dayNumber - 1)}
                    className={`py-1 rounded-lg text-xs transition ${
                      daysOffset === schedulingDay.dayNumber - 1 ? "bg-zinc-800 text-zinc-100 font-semibold" : "text-zinc-400"
                    }`}
                  >
                    Hari ke-{schedulingDay.dayNumber}
                  </button>
                </div>
              </div>

              {/* Prime Time Slot */}
              <div>
                <label className="block text-zinc-300 mb-1 font-medium">Pilih Jam Prime-Time WIB:</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["pagi", "siang", "malam"] as TimeSlotType[]).map((slot) => {
                    const isSelected = selectedSlot === slot;
                    const times = {
                      pagi: "08.00 WIB",
                      siang: "12.30 WIB",
                      malam: "20.00 WIB",
                    };
                    return (
                      <button
                        type="button"
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                          isSelected
                            ? "bg-zinc-900 border-zinc-600 text-zinc-100 font-semibold"
                            : "bg-zinc-900/40 border-zinc-850 text-zinc-400 hover:border-zinc-700"
                        }`}
                      >
                        <div className="capitalize">{slot}</div>
                        <div className="text-[10px] text-zinc-500 font-mono mt-0.5">{times[slot as "pagi" | "siang" | "malam"]}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Estimated target */}
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-850 text-[11px] text-zinc-400 flex items-center justify-between">
                <span>Target Waktu Eksekusi:</span>
                <span className="font-mono text-zinc-200">
                  {formatWibDateTime(calculateNextPrimeTime(selectedSlot, daysOffset))}
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSchedulingDay(null)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-300 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-zinc-100 text-zinc-950 font-semibold hover:bg-white cursor-pointer"
                >
                  Tambahkan ke Antrean
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
