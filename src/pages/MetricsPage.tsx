import React, { useState, useEffect } from "react";
import { BarChart3, Plus, TrendingUp, Info, Clock, MessageSquare, Heart, Users, Eye, HelpCircle } from "lucide-react";
import { storage } from "../lib/storage";
import { MetricEntry, CardUserWeight } from "../types";
import {
  calculateReplyToLike,
  calculateEngagementRate,
  calculateVelocity60,
  calculateMedian,
  calculateCardUserWeight,
} from "../lib/metrics";

export const MetricsPage: React.FC = () => {
  const [entries, setEntries] = useState<MetricEntry[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [topicTag, setTopicTag] = useState("Keuangan Pribadi");
  const [hookType, setHookType] = useState("hook_angka");
  const [timeWIB, setTimeWIB] = useState("19.30 - 22.30 WIB");
  const [views, setViews] = useState(1200);
  const [likes, setLikes] = useState(85);
  const [replies, setReplies] = useState(24);
  const [replyDepth, setReplyDepth] = useState(14);
  const [profileVisits, setProfileVisits] = useState(38);
  const [follows, setFollows] = useState(9);
  const [first60, setFirst60] = useState(18);
  const [cardId, setCardId] = useState("K01");

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    const list = await storage.getMetrics();
    if (list && list.length > 0) {
      setEntries(list);
    } else {
      // Data awal demonstrasi jika masih kosong
      const initialSeed: MetricEntry[] = [
        {
          id: "m1",
          date: "2026-10-01",
          topicTag: "Keuangan Pribadi",
          hookType: "hook_angka",
          timeWIB: "19.30 - 22.30 WIB",
          views: 3400,
          likes: 210,
          replies: 54, // RTL = 0.257
          replyDepth: 22,
          profileVisits: 65,
          follows: 14,
          first60MinInteractions: 35,
          replyToLike: 0.257,
          velocity60: 0.58,
          engagementRate: 0.084,
          cardId: "K01",
        },
        {
          id: "m2",
          date: "2026-10-03",
          topicTag: "Self Improvement",
          hookType: "self_callout",
          timeWIB: "07.30 - 09.00 WIB",
          views: 5200,
          likes: 420,
          replies: 78, // RTL = 0.185
          replyDepth: 35,
          profileVisits: 90,
          follows: 22,
          first60MinInteractions: 52,
          replyToLike: 0.185,
          velocity60: 0.86,
          engagementRate: 0.102,
          cardId: "K02",
        },
      ];
      setEntries(initialSeed);
      for (const item of initialSeed) {
        await storage.saveMetric(item);
      }
    }
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();

    const rtl = calculateReplyToLike(replies, likes);
    const eng = calculateEngagementRate(likes, replies, replyDepth, views);
    const vel = calculateVelocity60(first60);

    const newEntry: MetricEntry = {
      id: `m_${Date.now()}`,
      date,
      topicTag,
      hookType,
      timeWIB,
      views,
      likes,
      replies,
      replyDepth,
      profileVisits,
      follows,
      first60MinInteractions: first60,
      replyToLike: rtl ? Number(rtl.toFixed(3)) : null,
      velocity60: Number(vel.toFixed(2)),
      engagementRate: eng ? Number(eng.toFixed(3)) : null,
      cardId,
    };

    await storage.saveMetric(newEntry);
    const updated = [newEntry, ...entries];
    setEntries(updated);

    // Hitung bobot E untuk kartu ini jika ada cukup data
    const cardEntries = updated.filter((e) => e.cardId === cardId);
    const weightObj = calculateCardUserWeight(cardEntries, updated);
    await storage.saveCardWeight(weightObj);

    setShowAddForm(false);
  };

  // Kalkulasi Ringkasan
  const allRtls = entries
    .map((e) => e.replyToLike)
    .filter((v): v is number => v !== null && !isNaN(v));
  const medianRtl = calculateMedian(allRtls);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-white">Tracker Metrik Mandiri</h1>
          </div>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Pantau rasio Reply-to-Like dan kecepatan interaksi 60 menit pertama untuk membentuk bobot personalisasi (Label E).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Catat Metrik Postingan</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
          <span className="text-[11px] text-neutral-400 font-medium">Median Reply-to-Like</span>
          <div className="text-2xl font-black text-white">
            {medianRtl !== null ? medianRtl.toFixed(3) : "-"}
          </div>
          <span
            className={`text-[10px] font-bold block ${
              medianRtl && medianRtl >= 0.15 ? "text-emerald-400" : "text-amber-400"
            }`}
          >
            {medianRtl && medianRtl >= 0.15 ? "✓ Sehat di atas patokan 0,15" : "Patokan praktisi: > 0,15"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
          <span className="text-[11px] text-neutral-400 font-medium">Total Postingan Dicatat</span>
          <div className="text-2xl font-black text-white">{entries.length} Post</div>
          <span className="text-[10px] text-neutral-400">
            {entries.length >= 5 ? "Data cukup untuk bobot E" : "Data sedikit (butuh min 5)"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
          <span className="text-[11px] text-neutral-400 font-medium">Jam Ramai Terbaik</span>
          <div className="text-base sm:text-lg font-bold text-white truncate">19.30 - 22.30 WIB</div>
          <span className="text-[10px] text-neutral-400 block">Cenderung di akunmu</span>
        </div>

        <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
          <span className="text-[11px] text-neutral-400 font-medium">Tipe Hook Paling Ramai</span>
          <div className="text-base sm:text-lg font-bold text-indigo-400 truncate">Hook Angka & Audit</div>
          <span className="text-[10px] text-neutral-400 block">Berdasarkan median RTL</span>
        </div>
      </div>

      {/* Modal / Collapse Input Form */}
      {showAddForm && (
        <form onSubmit={handleAddEntry} className="p-6 rounded-2xl bg-neutral-900/90 border border-neutral-700 space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Catat Hasil Postingan Threads</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-neutral-300 mb-1">Tanggal Post:</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-300 mb-1">Topic Tag:</label>
              <input
                type="text"
                value={topicTag}
                onChange={(e) => setTopicTag(e.target.value)}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-300 mb-1">Jam Posting (WIB):</label>
              <select
                value={timeWIB}
                onChange={(e) => setTimeWIB(e.target.value)}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              >
                <option value="07.30 - 09.00 WIB">07.30 - 09.00 WIB (Pagi)</option>
                <option value="12.00 - 13.30 WIB">12.00 - 13.30 WIB (Siang)</option>
                <option value="19.30 - 22.30 WIB">19.30 - 22.30 WIB (Malam)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <label className="block text-neutral-300 mb-1">Views:</label>
              <input
                type="number"
                value={views}
                onChange={(e) => setViews(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-300 mb-1">Likes:</label>
              <input
                type="number"
                value={likes}
                onChange={(e) => setLikes(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-300 mb-1">Replies:</label>
              <input
                type="number"
                value={replies}
                onChange={(e) => setReplies(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-300 mb-1">Reply Depth (Cabang):</label>
              <input
                type="number"
                value={replyDepth}
                onChange={(e) => setReplyDepth(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block text-neutral-300 mb-1">Kunjungan Profil:</label>
              <input
                type="number"
                value={profileVisits}
                onChange={(e) => setProfileVisits(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-300 mb-1">Followers Baru:</label>
              <input
                type="number"
                value={follows}
                onChange={(e) => setFollows(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
            <div>
              <label className="block text-neutral-300 mb-1">Interaksi 60 Menit Pertama:</label>
              <input
                type="number"
                value={first60}
                onChange={(e) => setFirst60(Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-neutral-950 border border-neutral-800 text-white"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/25"
            >
              Simpan Data Metrik
            </button>
          </div>
        </form>
      )}

      {/* Table of Entries */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Riwayat Postingan</h3>
          <span className="text-[11px] text-neutral-400">Patokan RTL ideal: &gt; 0,15</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950 text-neutral-400 font-bold uppercase text-[10px] border-b border-neutral-800">
              <tr>
                <th className="p-3">Tanggal / Tag</th>
                <th className="p-3">Jam (WIB)</th>
                <th className="p-3 text-right">Views</th>
                <th className="p-3 text-right">Like</th>
                <th className="p-3 text-right">Reply</th>
                <th className="p-3 text-right">RTL Ratio</th>
                <th className="p-3 text-right">Velocity 60</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 font-mono text-xs">
              {entries.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-800/30 transition">
                  <td className="p-3">
                    <div className="font-semibold text-white font-sans">{item.topicTag}</div>
                    <div className="text-[10px] text-neutral-500 font-sans">{item.date}</div>
                  </td>
                  <td className="p-3 font-sans text-neutral-400">{item.timeWIB}</td>
                  <td className="p-3 text-right font-semibold">{item.views.toLocaleString()}</td>
                  <td className="p-3 text-right text-rose-400">{item.likes}</td>
                  <td className="p-3 text-right text-indigo-400 font-bold">{item.replies}</td>
                  <td className="p-3 text-right">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold ${
                        item.replyToLike && item.replyToLike >= 0.15
                          ? "bg-emerald-500/10 text-emerald-400"
                          : "bg-neutral-800 text-neutral-400"
                      }`}
                    >
                      {item.replyToLike !== null ? item.replyToLike.toFixed(3) : "-"}
                    </span>
                  </td>
                  <td className="p-3 text-right text-neutral-400">{item.velocity60} /mnt</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
