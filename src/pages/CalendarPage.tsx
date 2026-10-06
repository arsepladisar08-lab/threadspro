import React, { useState, useEffect } from "react";
import { CalendarDayItem, GoalType, UserProfile } from "../types";
import { storage } from "../lib/storage";
import { generateJSON } from "../services/ai";
import { Calendar, Download, Sparkles, RefreshCw, Clock, Tag, MessageCircle, Check, ArrowRight } from "lucide-react";

export const CalendarPage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [durationDays, setDurationDays] = useState<7 | 14>(7);
  const [modeFormula, setModeFormula] = useState<"umum" | "hub">("umum");
  const [calendarDays, setCalendarDays] = useState<CalendarDayItem[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [weeklyTheme, setWeeklyTheme] = useState("");
  const [summaryRationale, setSummaryRationale] = useState("");

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
        // Inisialisasi default 7 hari jika kosong
        generateDefaultPlan(7, "umum");
      }
    });
  }, []);

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
      alert(`Gagal membuat kalender: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Ekspor Kalender ke format .ics (iCalendar)
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

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Calendar className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">Kalender Konten Mingguan</h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Rencana posting {durationDays} hari terjadwal dengan target reply harian & proporsi algoritma ideal.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Durasi */}
          <div className="flex p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
            <button
              onClick={() => setDurationDays(7)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                durationDays === 7 ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              7 Hari
            </button>
            <button
              onClick={() => setDurationDays(14)}
              className={`px-3 py-1 rounded-lg font-semibold transition ${
                durationDays === 14 ? "bg-indigo-600 text-white" : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              14 Hari
            </button>
          </div>

          {/* Mode Formula */}
          <div className="flex p-1 rounded-xl bg-neutral-900 border border-neutral-800 text-xs">
            <button
              onClick={() => setModeFormula("umum")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                modeFormula === "umum" ? "bg-neutral-800 text-white" : "text-neutral-400"
              }`}
              title="40% Jangkauan / 40% Kedekatan / 20% Konversi"
            >
              Umum
            </button>
            <button
              onClick={() => setModeFormula("hub")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                modeFormula === "hub" ? "bg-neutral-800 text-white" : "text-neutral-400"
              }`}
              title="Senin Ilmu, Rabu Peluang, Jumat Lapak, Sabtu Softsell"
            >
              Hub Kreator
            </button>
          </div>

          {/* Export .ics */}
          <button
            type="button"
            onClick={handleExportICS}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-neutral-700 transition"
            title="Download file kalender (.ics) untuk Google Calendar"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Ekspor</span> .ics
          </button>

          {/* Generate AI Button */}
          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            <span>Susun Rencana AI</span>
          </button>
        </div>
      </div>

      {/* Rationale Banner */}
      {weeklyTheme && (
        <div className="p-4 rounded-2xl bg-neutral-900/60 border border-neutral-800 space-y-1">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="text-indigo-400 uppercase tracking-wider text-[10px]">Fokus Tema:</span>
            <span className="text-neutral-400 font-normal text-[11px]">
              {modeFormula === "umum"
                ? "Formula: 40% Jangkauan | 40% Kedekatan | 20% Konversi"
                : "Formula Hub: 30% Ilmu | 30% Peluang | 20% Panggung Warga | 20% Soft-selling"}
            </span>
          </div>
          <h3 className="text-sm font-bold text-white">{weeklyTheme}</h3>
          {summaryRationale && <p className="text-xs text-neutral-400">{summaryRationale}</p>}
        </div>
      )}

      {/* Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {calendarDays.map((day) => {
          const isJumatLapak = day.dayName === "Jumat" && modeFormula === "hub";
          return (
            <div
              key={day.id || day.dayNumber}
              className={`p-4 rounded-2xl border transition-all space-y-3 ${
                isJumatLapak
                  ? "bg-purple-950/20 border-purple-500/30"
                  : "bg-neutral-900/70 border-neutral-800/80 hover:border-neutral-700"
              }`}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-neutral-800 text-neutral-300 font-black text-xs flex items-center justify-center">
                    {day.dayNumber}
                  </span>
                  <span className="text-sm font-bold text-white">{day.dayName}</span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    day.goal === "Jangkauan"
                      ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                      : day.goal === "Kedekatan"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : day.goal === "Konversi" || day.goal === "Soft-selling"
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  }`}
                >
                  {day.goal}
                </span>
              </div>

              {/* Pillar & Prompt */}
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-neutral-200 line-clamp-1">{day.pillar}</h4>
                <p className="text-xs text-neutral-400 leading-relaxed line-clamp-3">{day.ideaPrompt}</p>
              </div>

              {/* Hook Pattern info */}
              <div className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-[11px] text-neutral-300 space-y-0.5">
                <div className="text-[10px] text-neutral-400 font-semibold uppercase">Pola Hook:</div>
                <div className="line-clamp-2 italic text-neutral-400">"{day.hookPattern}"</div>
              </div>

              {/* Meta: Topic Tag & WIB Time */}
              <div className="flex items-center justify-between text-[11px] text-neutral-400 pt-1">
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3 text-indigo-400" />
                  <span>{day.topicTag}</span>
                </span>
                <span className="flex items-center gap-1 text-amber-400 font-medium">
                  <Clock className="w-3 h-3" />
                  <span>{day.timeWIB}</span>
                </span>
              </div>

              {/* Daily Reply Goal */}
              <div className="pt-2 border-t border-neutral-800/80 flex items-center gap-1.5 text-[11px] text-neutral-300">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="line-clamp-1">{day.replyActionGoal}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
