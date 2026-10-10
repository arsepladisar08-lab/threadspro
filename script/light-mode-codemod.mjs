#!/usr/bin/env node
/**
 * AutoThreads: Light-mode codemod
 *
 * Banyak halaman ditulis hanya untuk mode gelap (mis. `bg-zinc-900 text-zinc-300`).
 * Skrip ini menambahkan pasangan mode terang di depan kelas tersebut dan memindahkan
 * kelas lama ke varian `dark:`:
 *
 *   bg-zinc-900 text-zinc-300  ->  bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300
 *
 * Aman dijalankan berulang (idempotent): baris yang sudah punya pasangan `dark:` dilewati.
 *
 * Pemakaian:
 *   node scripts/light-mode-codemod.mjs --dry-run   # hanya laporan, tidak menulis file
 *   node scripts/light-mode-codemod.mjs             # terapkan
 *
 * Tandai baris yang sengaja harus tetap gelap dengan komentar `codemod:keep-dark`.
 */
import fs from "node:fs";
import path from "node:path";

const DRY_RUN = process.argv.includes("--dry-run");
const ROOT = process.cwd();
const DIRS = ["src/pages", "src/components"];

// Sudah punya varian terang/gelap, atau sengaja gelap di kedua mode.
const SKIP_FILES = new Set([
  "Navbar.tsx",
  "Sidebar.tsx",
  "BottomNav.tsx",
  "MobileDrawer.tsx",
  "VisualCardGenerator.tsx", // studio kartu visual: sengaja gelap, kanvas punya tema sendiri
]);

const NEUTRAL = "(?:zinc|neutral|slate|gray|stone)";
const COLOR =
  "(?:emerald|rose|amber|indigo|sky|red|green|yellow|orange|blue|violet|purple|pink|teal|cyan|lime|fuchsia)";
const VARIANT =
  "(?:(?:hover|focus|focus-visible|focus-within|active|disabled|group-hover|sm|md|lg|xl|2xl|first|last|odd|even|open):)*";
// Token harus diawali batas kata (bukan ':' agar varian dark: tidak ikut tertangkap)
const LB = "(?<![\\w:\\-\\[\\/.])";
const TAIL = "(?![\\w\\-])";

// Peta shade gelap -> padanan terang
const BG_LIGHT = { 950: "white", 900: "100", 850: "200", 800: "200", 750: "300", 700: "300", 650: "300", 600: "300" };
const BORDER_LIGHT = { 950: "200", 900: "200", 850: "200", 800: "300", 750: "300", 700: "300", 650: "400", 600: "400" };
const TEXT_LIGHT = { 50: "950", 100: "900", 200: "800", 300: "700", 400: "500" };
const COLOR_TEXT_LIGHT = { 200: "800", 300: "700", 400: "600" };

const stats = { files: 0, lines: 0, tokens: 0 };
const review = [];

const hasDarkPair = (line, variants, util) => line.includes(`dark:${variants}${util}-`);
const pair = (variants, light, orig) => `${variants}${light} dark:${variants}${orig}`;

function transformLine(line) {
  if (line.includes("codemod:keep-dark")) return line;
  let out = line;
  let changed = 0;
  const bump = (s) => {
    changed++;
    return s;
  };

  // 1) Tombol "terbalik" (latar terang + teks gelap) -> di mode terang jadi tombol gelap
  const invBg = new RegExp(`${LB}(${VARIANT})bg-(?:white|${NEUTRAL}-(?:100|200))(?![\\w\\-\\/])`);
  const invTxt = new RegExp(`${LB}text-${NEUTRAL}-(?:900|950)${TAIL}`);
  if (!out.includes("dark:") && invTxt.test(out) && invBg.test(out)) {
    out = out.replace(
      new RegExp(`${LB}(${VARIANT})bg-(white|${NEUTRAL}-(?:100|200))(?![\\w\\-\\/])`, "g"),
      (m, v, tone) => bump(pair(v, v.includes("hover") ? "bg-zinc-800" : "bg-zinc-900", `bg-${tone}`)),
    );
    out = out.replace(
      new RegExp(`${LB}(${VARIANT})text-(${NEUTRAL}-(?:900|950))${TAIL}`, "g"),
      (m, v, tone) => bump(pair(v, "text-white", `text-${tone}`)),
    );
  }

  // 2) Latar & garis netral gelap
  out = out.replace(
    new RegExp(`${LB}(${VARIANT})(bg|border|divide)-(${NEUTRAL})-(950|900|850|800|750|700|650|600)(\\/\\d+)?${TAIL}`, "g"),
    (m, v, util, fam, shade, alpha = "") => {
      if (hasDarkPair(out, v, util)) return m;
      let light;
      if (util === "bg") {
        const to = BG_LIGHT[shade];
        light = to === "white" ? `bg-white${alpha}` : `bg-${fam}-${to}${alpha}`;
      } else {
        light = `${util}-${fam}-${BORDER_LIGHT[shade]}`;
      }
      return bump(pair(v, light, `${util}-${fam}-${shade}${alpha}`));
    },
  );

  // 3) Teks terang-di-gelap (neutral)
  out = out.replace(
    new RegExp(`${LB}(${VARIANT})text-(${NEUTRAL})-(50|100|200|300|400)${TAIL}`, "g"),
    (m, v, fam, shade) => {
      if (hasDarkPair(out, v, "text")) return m;
      return bump(pair(v, `text-${fam}-${TEXT_LIGHT[shade]}`, `text-${fam}-${shade}`));
    },
  );

  // 3b) placeholder gelap -> lebih terang di mode terang
  out = out.replace(new RegExp(`${LB}(${VARIANT})placeholder-(${NEUTRAL})-(600|700)${TAIL}`, "g"), (m, v, fam, shade) => {
    if (hasDarkPair(out, v, "placeholder")) return m;
    return bump(pair(v, `placeholder-${fam}-400`, `placeholder-${fam}-${shade}`));
  });

  // 4) Teks pastel berwarna (emerald-300, rose-400, ...) -> lebih pekat di mode terang
  out = out.replace(new RegExp(`${LB}(${VARIANT})text-(${COLOR})-(200|300|400)${TAIL}`, "g"), (m, v, c, shade) => {
    if (hasDarkPair(out, v, "text")) return m;
    return bump(pair(v, `text-${c}-${COLOR_TEXT_LIGHT[shade]}`, `text-${c}-${shade}`));
  });

  // 5) Tint gelap berwarna (bg-rose-950/20, border-emerald-900) -> tint terang
  out = out.replace(
    new RegExp(`${LB}(${VARIANT})(bg|border)-(${COLOR})-(800|900|950)(\\/\\d+)?${TAIL}`, "g"),
    (m, v, util, c, shade, alpha = "") => {
      if (hasDarkPair(out, v, util)) return m;
      return bump(pair(v, `${util}-${c}-${util === "bg" ? "50" : "200"}`, `${util}-${c}-${shade}${alpha}`));
    },
  );

  // 6) Overlay putih transparan (bg-white/5) tidak terlihat di latar terang
  out = out.replace(new RegExp(`${LB}(${VARIANT})(bg|border)-white(\\/\\d+)${TAIL}`, "g"), (m, v, util, alpha) => {
    if (hasDarkPair(out, v, util)) return m;
    return bump(pair(v, `${util}-black${alpha}`, `${util}-white${alpha}`));
  });

  // 7) text-white: ubah hanya jika baris tidak punya latar berwarna pekat/gradien
  const solidColorBg = new RegExp(`${LB}bg-${COLOR}-(?:500|600|700|800|900)(?![\\w\\-\\/])|bg-gradient|${LB}(?:from|to|via)-`);
  const original = line;
  if (!out.includes("dark:text-") && !solidColorBg.test(original) && !/bg-black(?![\w\/])/.test(original)) {
    out = out.replace(new RegExp(`${LB}(${VARIANT})text-white${TAIL}`, "g"), (m, v) => {
      // Ubah jika latar gelap tadi sudah dipetakan ke terang (langkah 2) atau baris tak punya latar sama sekali
      const mappedDarkBg = /dark:[^"'`\s]*bg-(?:zinc|neutral|slate|gray|stone)-(?:700|800|850|900|950)/.test(out);
      const noBg = !/(^|[\s"'`:])bg-/.test(original);
      if (!mappedDarkBg && !noBg) return m;
      return bump(pair(v, "text-zinc-900", "text-white"));
    });
  }

  if (changed) {
    stats.lines++;
    stats.tokens += changed;
  }
  return out;
}

function walk(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs
    .readdirSync(abs)
    .filter((f) => f.endsWith(".tsx") && !SKIP_FILES.has(f))
    .map((f) => path.join(dir, f));
}

for (const file of DIRS.flatMap(walk)) {
  const src = fs.readFileSync(path.join(ROOT, file), "utf8");
  const before = stats.tokens;
  const next = src.split("\n").map(transformLine).join("\n");
  if (next !== src) {
    stats.files++;
    console.log(`${DRY_RUN ? "[dry-run] " : ""}${file}: ${stats.tokens - before} token`);
    if (!DRY_RUN) fs.writeFileSync(path.join(ROOT, file), next);
  }
  // Sisa yang perlu dicek manual
  next.split("\n").forEach((l, i) => {
    if (l.includes("codemod:keep-dark") || l.includes("dark:")) return;
    if (new RegExp(`${LB}text-white${TAIL}`).test(l) || new RegExp(`${LB}bg-black(?![\\w\\/])`).test(l)) {
      review.push(`${file}:${i + 1}: ${l.trim().slice(0, 120)}`);
    }
  });
}

console.log(`\nRingkasan: ${stats.tokens} kelas diubah di ${stats.lines} baris pada ${stats.files} file.`);
if (review.length) {
  console.log(`\nPeriksa manual (${review.length} baris dengan text-white/bg-black tanpa pasangan dark:):`);
  review.slice(0, 40).forEach((r) => console.log("  " + r));
  if (review.length > 40) console.log(`  ... dan ${review.length - 40} lainnya`);
}
