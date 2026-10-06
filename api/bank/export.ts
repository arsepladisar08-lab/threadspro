import { REFERENCE_CARDS } from "../../src/data/bank";

export default function handler(req: any, res: any) {
  let md = "# BANK REFERENSI UTAS THREADS INDONESIA\n";
  md += `Diekspor dari AutoThreads API pada ${new Date().toISOString().split("T")[0]}\n\n`;
  md += "## CARA PAKAI\n1. Bank ini berisi POLA (hook, struktur, emosi, sinyal), bukan teks untuk disalin.\n2. Label Provenance: A (Ulasan Viral), B (Klaim Teruji), C (Hipotetis), D (Pencarian Threads), E (Terbukti di Akun User).\n\n";
  md += "---\n# KARTU REFERENSI TERVERIFIKASI\n\n";

  REFERENCE_CARDS.forEach((card) => {
    md += `## ${card.id} ${card.niche.toUpperCase()} [Mode: ${card.mode}]\n`;
    md += `- Format: ${card.format}\n`;
    md += `- Struktur: ${card.struktur}\n`;
    md += `- Emosi: ${card.emosi}\n`;
    md += `- Sinyal Algoritma: ${card.sinyal_algoritma}\n`;
    md += `- Pola Komentar: ${card.pola_komentar}\n`;
    md += `- Pelajaran: ${card.pelajaran}\n`;
    md += `- Guardrail: ${card.guardrail}\n`;
    md += `- Provenance: [${card.provenance}]\n`;
    md += "- Hooks:\n";
    card.hooks.forEach((hook) => {
      md += `  - ${hook.id} [${hook.provenance}] pola: "${hook.pola_slot}" | Contoh: "${hook.contoh_asli}"\n`;
    });
    md += "\n";
  });

  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="BANK_REFERENSI_THREADS.md"');
  return res.status(200).send(md);
}
