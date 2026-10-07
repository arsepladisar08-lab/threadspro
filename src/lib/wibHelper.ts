/**
 * Helper Konversi & Penjadwalan Waktu Indonesia Barat (WIB / UTC+7)
 * Memastikan presisi penanggalan dan countdown waktu prime-time
 */

import { TimeSlotType } from "../types";

export const PRIME_TIME_SLOTS = {
  pagi: {
    label: "Pagi (07.30 - 09.00 WIB)",
    hours: 8,
    minutes: 0,
    windowDesc: "Audience commuting & sarapan",
  },
  siang: {
    label: "Siang (12.00 - 13.30 WIB)",
    hours: 12,
    minutes: 30,
    windowDesc: "Istirahat makan siang & cek gawai",
  },
  malam: {
    label: "Malam (19.30 - 22.30 WIB)",
    hours: 20,
    minutes: 0,
    windowDesc: "Prime-time santai malam, engagement tertinggi",
  },
} as const;

/**
 * Dapatkan waktu saat ini dalam timezone Asia/Jakarta (WIB)
 */
export function getWibDate(date = new Date()): Date {
  // Offset WIB adalah +7 jam (420 menit)
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  return new Date(utc + 7 * 3600000);
}

/**
 * Format string ISO ke format ramah WIB: "Senin, 14 Okt 2026 20.00 WIB"
 */
export function formatWibDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return isoString;

    return new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(d) + " WIB";
  } catch {
    return isoString;
  }
}

/**
 * Hitung countdown waktu tayang dari target ISO
 */
export function getTimeRemainingWib(targetIsoString: string): {
  isDue: boolean;
  text: string;
  diffMinutes: number;
} {
  const targetTime = new Date(targetIsoString).getTime();
  const now = Date.now();
  const diffMs = targetTime - now;

  if (diffMs <= 0) {
    return { isDue: true, text: "Waktunya tayang", diffMinutes: 0 };
  }

  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const days = Math.floor(hours / 24);

  let text = "";
  if (days > 0) {
    text = `${days}h ${hours % 24}j lagi`;
  } else if (hours > 0) {
    text = `${hours} jam ${minutes} mnt lagi`;
  } else {
    text = `${minutes} menit lagi`;
  }

  return { isDue: false, text, diffMinutes };
}

/**
 * Menghitung waktu ISO target untuk slot prime time WIB berikutnya
 */
export function calculateNextPrimeTime(
  slot: TimeSlotType,
  targetDateOffsetDays = 0,
  customHour?: number,
  customMinute?: number
): string {
  const nowWib = getWibDate();
  const targetYear = nowWib.getFullYear();
  const targetMonth = nowWib.getMonth();
  const targetDate = nowWib.getDate() + targetDateOffsetDays;

  let h = 20;
  let m = 0;

  if (slot === "pagi") {
    h = PRIME_TIME_SLOTS.pagi.hours;
    m = PRIME_TIME_SLOTS.pagi.minutes;
  } else if (slot === "siang") {
    h = PRIME_TIME_SLOTS.siang.hours;
    m = PRIME_TIME_SLOTS.siang.minutes;
  } else if (slot === "malam") {
    h = PRIME_TIME_SLOTS.malam.hours;
    m = PRIME_TIME_SLOTS.malam.minutes;
  } else if (slot === "custom" && customHour !== undefined) {
    h = customHour;
    m = customMinute || 0;
  }

  // Buat tanggal target dalam representasi WIB
  // Note: konstruksi UTC dengan mengurangi 7 jam untuk konversi ke UTC murni
  const utcDate = new Date(Date.UTC(targetYear, targetMonth, targetDate, h - 7, m, 0, 0));

  // Jika slot hari ini sudah lewat dan offset adalah 0, geser ke besok
  if (targetDateOffsetDays === 0 && utcDate.getTime() <= Date.now()) {
    utcDate.setUTCDate(utcDate.getUTCDate() + 1);
  }

  return utcDate.toISOString();
}
