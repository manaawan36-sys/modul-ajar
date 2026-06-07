import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  BookOpen,
  FileText,
  Sparkles,
  Copy,
  Check,
  Download,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  History,
  User,
  School,
  Calendar,
  Layers,
  Clock,
  HelpCircle,
  Trash2,
  Loader2,
  FileSpreadsheet,
  Gauge,
  PlusCircle,
  FileCode,
  Printer,
  CheckSquare,
  Key,
  AlertCircle
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Dimensions, GeneratorParams, GeneratedHistoryItem, DocumentType } from "./types";

// Official Dimensions / Profil Pelajar Pancasila based on SKL Kemendikbudristek
const DIMENSI_LIST: Dimensions[] = [
  { id: "iman_takwa", nama: "Beriman & Bertakwa", deskripsi: "Keimanan, ketakwaan kepada Tuhan YME, dan akhlak mulia." },
  { id: "nalar_kritis", nama: "Bernalar Kritis", deskripsi: "Mampu memproses informasi, menganalisis, dan mengevaluasi nalar." },
  { id: "kolaborasi", nama: "Gotong Royong", deskripsi: "Kolaborasi, kepedulian, dan kesediaan berbagi dengan sesama." },
  { id: "kemandirian", nama: "Mandiri", deskripsi: "Prakarsa atas pengembangan dirinya secara independen." },
  { id: "kreativitas", nama: "Kreatif", deskripsi: "Menghasilkan sesuatu yang orisinal, bermakna, dan berdampak." },
  { id: "kebinekaan", nama: "Kebinekaan Global", deskripsi: "Mempertahankan budaya luhur serta terbuka dalam interaksi." },
  { id: "komunikasi", nama: "Komunikatif", deskripsi: "Keterampilan menyampaikan gagasan dan berdiskusi aktif." },
  { id: "kesehatan", nama: "Kesejahteraan Diri", deskripsi: "Menjaga kesehatan fisik, mental, dan emosi saat beraktivitas." }
];

const PEMETAAN_AKADEMIK = {
  "PAUD/TK": {
    fase: ["Fase Fondasi"],
    kelas: ["Kelompok A (Usia 4-5 Tahun)", "Kelompok B (Usia 5-6 Tahun)"]
  },
  "SD/MI": {
    fase: ["Fase A", "Fase B", "Fase C"],
    kelas: ["Kelas 1", "Kelas 2", "Kelas 3", "Kelas 4", "Kelas 5", "Kelas 6"]
  },
  "SMP/MTs": {
    fase: ["Fase D"],
    kelas: ["Kelas 7", "Kelas 8", "Kelas 9"]
  },
  "SMA/MA/SMK": {
    fase: ["Fase E", "Fase F"],
    kelas: ["Kelas 10", "Kelas 11", "Kelas 12"]
  }
};

const PRESETS = [
  {
    label: "Matematika SD (Pecahan Senilai)",
    params: {
      namaGuru: "Ahmad Subarjo, S.Pd.",
      namaInstitusi: "SD Merdeka Cemerlang",
      kurikulum: "Kurikulum Merdeka",
      jenjang: "SD/MI" as const,
      fase: "Fase B",
      kelas: "Kelas 4",
      mataPelajaran: "Matematika",
      materiPokok: "Pecahan Senilai",
      jumlahPertemuan: 2,
      lamaPertemuan: "2 x 35 Menit",
      modelPembelajaran: "Problem Based Learning (PBL)",
      capaianPembelajaran: "Peserta didik dapat memahami dan membandingkan konsep pecahan senilai dengan alat peraga.",
      tujuanPembelajaran: "Mengidentifikasi gambar pecahan senilai, menyelesaikan studi kasus pecahan dengan potong kertas.",
      dimensiLulusan: ["Beriman & Bertakwa", "Bernalar Kritis", "Gotong Royong"],
      catatanTambahan: "Siswa menggunakan media konkret potong kertas origami. Tekankan kerja berkelompok aktif yang inklusif.",
      tipeDokumen: "modul" as const
    }
  },
  {
    label: "IPA SMP (Sistem Pencernaan)",
    params: {
      namaGuru: "Dewi Lestari, M.Pd.",
      namaInstitusi: "SMP N 1 Harapan Bangsa",
      kurikulum: "Kurikulum Merdeka",
      jenjang: "SMP/MTs" as const,
      fase: "Fase D",
      kelas: "Kelas 8",
      mataPelajaran: "Ilmu Pengetahuan Alam (IPA)",
      materiPokok: "Sistem Organ Pencernaan Manusia",
      jumlahPertemuan: 3,
      lamaPertemuan: "2 x 40 Menit",
      modelPembelajaran: "Project Based Learning (PjBL)",
      capaianPembelajaran: "Peserta didik memahami sistem organ pencernaan manusia serta kaitannya dengan perilaku hidup sehat.",
      tujuanPembelajaran: "Siswa mampu menyebutkan organ pencernaan beserta fungsinya dan mempresentasikan infografis pola gizi seimbang.",
      dimensiLulusan: ["Bernalar Kritis", "Kreatif", "Gotong Royong"],
      catatanTambahan: "Siswa merancang poster/infografis perjalanan makanan. Tambahkan instruksi kriteria penilaian poster kelompok.",
      tipeDokumen: "modul" as const
    }
  },
  {
    label: "B. Inggris SMA (Analytical Exposition)",
    params: {
      namaGuru: "Budi Santoso, S.S.",
      namaInstitusi: "SMA Unggul Jaya",
      kurikulum: "Kurikulum Merdeka",
      jenjang: "SMA/MA/SMK" as const,
      fase: "Fase F",
      kelas: "Kelas 11",
      mataPelajaran: "Bahasa Inggris",
      materiPokok: "Analytical Exposition Text (Benefits of Healthy Life)",
      jumlahPertemuan: 2,
      lamaPertemuan: "2 x 45 Menit",
      modelPembelajaran: "Discovery / Inquiry Learning",
      capaianPembelajaran: "Peserta didik menggunakan teks eksposisi analitis tertulis dan lisan untuk menyampaikan argumen kritis terstruktur.",
      tujuanPembelajaran: "Mengidentifikasi tesis/argumen dalam teks eksposisi analitis, serta menyusun teks eksposisi tertulis bertema kesehatan mandiri.",
      dimensiLulusan: ["Bernalar Kritis", "Mandiri"],
      catatanTambahan: "Fokus pada struktur tesis, argumen pendukung, dan reiterasi. Berikan kosakata transisi (firstly, moreover, indeed) untuk memperluas nalar.",
      tipeDokumen: "modul" as const
    }
  }
];

const ENCOURAGING_TIPS = [
  "Sedang menghubungi asisten kepakaran AI Kurikulum Merdeka...",
  "Menganalisis SKL Terbaru Kemendikbudristek untuk standar KKTP...",
  "Merancang sintaks pembelajaran interaktif dan eksploratif...",
  "Merajut instrumen Asesmen Diagnostik, Formatif, dan Sumatif...",
  "Mengelevasi indikator kecakapan Profil Pelajar Pancasila...",
  "Generasi draf instan sedang divalidasi dan dioptimasi..."
];

export default function App() {
  // Navigation steps
  const [step, setStep] = useState<number>(1);

  // Form parameters
  const [params, setParams] = useState<GeneratorParams>({
    namaGuru: "",
    namaInstitusi: "",
    kurikulum: "Kurikulum Merdeka",
    jenjang: "SD/MI",
    fase: "Fase A",
    kelas: "Kelas 1",
    mataPelajaran: "",
    materiPokok: "",
    jumlahPertemuan: 2,
    lamaPertemuan: "2 x 35 Menit",
    modelPembelajaran: "Problem Based Learning (PBL)",
    capaianPembelajaran: "",
    tujuanPembelajaran: "",
    dimensiLulusan: ["Bernalar Kritis"],
    catatanTambahan: "",
    tipeDokumen: "modul"
  });

  // UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [loaderMessageIndex, setLoaderMessageIndex] = useState<number>(0);
  const [outputText, setOutputText] = useState<string>("");
  const [viewMode, setViewMode] = useState<"formatted" | "raw">("formatted");
  const [copied, setCopied] = useState<boolean>(false);
  const [errorText, setErrorText] = useState<string>("");
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [apiErrorMessage, setApiErrorMessage] = useState<string>("");
  const [historyList, setHistoryList] = useState<GeneratedHistoryItem[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);

  // Load history from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("merdeka_generator_history");
      if (stored) {
        setHistoryList(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Terdapat kegagalan saat membaca riwayat lokal:", e);
    }
  }, []);

  // Save history helper
  const saveHistory = (newList: GeneratedHistoryItem[]) => {
    setHistoryList(newList);
    try {
      localStorage.setItem("merdeka_generator_history", JSON.stringify(newList));
    } catch (e) {
      console.error("Terdapat kegagalan saat menyimpan riwayat lokal:", e);
    }
  };

  // Sync Fase & Kelas choices when Jenjang changes
  useEffect(() => {
    const choices = PEMETAAN_AKADEMIK[params.jenjang];
    setParams((prev) => ({
      ...prev,
      fase: choices.fase[0],
      kelas: choices.kelas[0]
    }));
  }, [params.jenjang]);

  // Loading encouraging messages loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setLoaderMessageIndex((prev) => (prev + 1) % ENCOURAGING_TIPS.length);
      }, 5000);
    } else {
      setLoaderMessageIndex(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Dimensions Multi-select Handler
  const toggleDimensi = (dimensiNama: string) => {
    setParams((prev) => {
      const exists = prev.dimensiLulusan.includes(dimensiNama);
      if (exists) {
        return {
          ...prev,
          dimensiLulusan: prev.dimensiLulusan.filter((d) => d !== dimensiNama)
        };
      } else {
        return {
          ...prev,
          dimensiLulusan: [...prev.dimensiLulusan, dimensiNama]
        };
      }
    });
  };

  // Load Preset
  const applyPreset = (preset: typeof PRESETS[0]) => {
    setParams({
      ...preset.params
    });
    setErrorText("");
  };

  // Form reset
  const clearForm = () => {
    setParams({
      namaGuru: "",
      namaInstitusi: "",
      kurikulum: "Kurikulum Merdeka",
      jenjang: "SD/MI",
      fase: "Fase A",
      kelas: "Kelas 1",
      mataPelajaran: "",
      materiPokok: "",
      jumlahPertemuan: 2,
      lamaPertemuan: "2 x 35 Menit",
      modelPembelajaran: "Problem Based Learning (PBL)",
      capaianPembelajaran: "",
      tujuanPembelajaran: "",
      dimensiLulusan: ["Bernalar Kritis"],
      catatanTambahan: "",
      tipeDokumen: "modul"
    });
    setErrorText("");
    setStep(1);
  };

  // Submit and call server-side API
  const handleGenerate = async () => {
    setLoading(true);
    setErrorText("");
    setOutputText("");
    setSelectedHistoryId(null);
    setIsFallback(false);
    setApiErrorMessage("");

    try {
      const response = await fetch("/api/generate-modul", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params)
      });
      const data = await response.json();

      if (data.success) {
        setOutputText(data.text);
        if (data.isFallback) {
          setIsFallback(true);
          setApiErrorMessage(data.apiErrorMessage || "");
        }
        
        // Add to history
        const newItem: GeneratedHistoryItem = {
          id: Math.random().toString(36).substr(2, 9),
          timestamp: new Date().toLocaleString("id-ID", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          }),
          params: { ...params },
          outputText: data.text
        };
        const updatedHistory = [newItem, ...historyList].slice(0, 50); // limit 50
        saveHistory(updatedHistory);
        setSelectedHistoryId(newItem.id);
      } else {
        setErrorText(data.error || "Gagal memperoleh draf dari modul instruksi.");
      }
    } catch (e: any) {
      console.error(e);
      setErrorText("Terjadi masalah jaringan atau server tidak merespon saat membuat isi modul.");
    } finally {
      setLoading(false);
    }
  };

  // Load a historic generated item
  const loadHistoryItem = (item: GeneratedHistoryItem) => {
    setParams(item.params);
    setOutputText(item.outputText);
    setSelectedHistoryId(item.id);
    setErrorText("");
    setIsFallback(false);
    setApiErrorMessage("");
  };

  // Delete a history item
  const deleteHistoryItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = historyList.filter((item) => item.id !== id);
    saveHistory(updated);
    if (selectedHistoryId === id) {
      setSelectedHistoryId(null);
      setOutputText("");
    }
  };

  // Copy Output
  const copyToClipboard = () => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download Output File (.md)
  const downloadMarkdown = () => {
    if (!outputText) return;
    const cleanTitle = (params.materiPokok || "Modul_Ajar")
      .trim()
      .replace(/\s+/g, "_")
      .replace(/[^a-zA-Z0-9_]/g, "");
    
    // Choose suffix based on document type
    let suffix = "Modul_Ajar";
    if (params.tipeDokumen === "lkpd") suffix = "LKPD_Siswa";
    else if (params.tipeDokumen === "asesmen") suffix = "Kriteria_Asesmen";
    else if (params.tipeDokumen === "bahan_ajar") suffix = "Materi_Bahan_Ajar";

    const fileName = `${suffix}_${cleanTitle}.md`;
    const element = document.createElement("a");
    const file = new Blob([outputText], { type: "text/markdown;charset=utf-8" });
    element.href = URL.createObjectURL(file);
    element.download = fileName;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Render Title for document types
  const getDocumentTypeTitle = (type: DocumentType) => {
    switch (type) {
      case "modul":
        return "Modul Ajar / Rencana Pelaksanaan Pembelajaran (RPP)";
      case "lkpd":
        return "Lembar Kerja Peserta Didik (LKPD - Kerja Siswa)";
      case "asesmen":
        return "Rencana Asesmen / Kisi-Kisi & Rubrik Penilaian";
      case "bahan_ajar":
        return "Bahan Bacaan Ringkas & Glosarium Materi";
      default:
        return "Modul Pembelajaran";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col antialiased">
      {/* Premium Top Navigation header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs" id="main-app-header">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-sm">
              <BookOpen className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                MerdekaAI <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 font-medium rounded-full">Generator Modul Mandiri</span>
              </h1>
              <p className="text-xs text-slate-500 font-medium">Buat modul Kurikulum Merdeka instan, terarah, dan sesuai SKL Nasional</p>
            </div>
          </div>

          {/* Quick Presets for demonstration */}
          <div className="flex flex-wrap items-center gap-2" id="preset-selector-container">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide mr-1">Contoh Cepat:</span>
            {PRESETS.map((preset, index) => (
              <button
                key={index}
                id={`preset-button-${index}`}
                onClick={() => applyPreset(preset)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 active:bg-blue-100 text-slate-700 hover:text-blue-700 font-medium text-xs rounded-lg transition-all border border-slate-200 hover:border-blue-200 cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Grid Content Container */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8" id="generator-main">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: Multi-step Interactive Generator Form */}
          <section className="lg:col-span-7 bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm" id="inputs-panel">
            
            {/* Step badges indicator */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100" id="step-indicators">
              <div className="flex items-center space-x-3">
                <span
                  id="step-number-1"
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-xs ${
                    step === 1
                      ? "bg-blue-600 text-white"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {step > 1 ? "✓" : "1"}
                </span>
                <span className={`font-semibold text-sm sm:text-base ${step === 1 ? "text-slate-900" : "text-slate-400"}`}>
                  Informasi Dasar Guru & Sekolah
                </span>
              </div>
              <div className="w-12 h-px bg-slate-200"></div>
              <div className="flex items-center space-x-3">
                <span
                  id="step-number-2"
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-xs ${
                    step === 2
                      ? "bg-blue-600 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  2
                </span>
                <span className={`font-medium text-sm sm:text-base ${step === 2 ? "text-slate-900" : "text-slate-400"}`}>
                  Spesifikasi & Model Belajar
                </span>
              </div>
            </div>

            {/* ERROR ALERTS SCREEN */}
            {errorText && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl text-sm flex flex-col gap-2" id="form-error-alert">
                <div className="font-bold flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-rose-600" /> Gagal Memproses Modul
                </div>
                <p className="text-rose-700">{errorText}</p>
              </div>
            )}

            {/* FORM STEP 1 */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
                id="form-step-1"
              >
                <div className="border-l-4 border-blue-600 pl-3">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                    <User className="w-4 h-4 text-blue-600" /> A. Identitas Penyusun dan Institusi
                  </h3>
                  <p className="text-xs text-slate-500">Isilah detail personal pengajar untuk draf resmi modul</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="input-nama-guru">
                      Nama Guru / Penyusun
                    </label>
                    <input
                      type="text"
                      id="input-nama-guru"
                      value={params.namaGuru}
                      onChange={(e) => setParams({ ...params, namaGuru: e.target.value })}
                      placeholder="Contoh: Ahmad Subarjo, S.Pd."
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="input-nama-institusi">
                      Nama Institusi / Sekolah
                    </label>
                    <input
                      type="text"
                      id="input-nama-institusi"
                      value={params.namaInstitusi}
                      onChange={(e) => setParams({ ...params, namaInstitusi: e.target.value })}
                      placeholder="Contoh: MI Al Kadaria Congko"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="border-l-4 border-blue-600 pl-3 pt-2">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                    <School className="w-4 h-4 text-blue-600" /> B. Tingkatan & Detil Kurikulum
                  </h3>
                  <p className="text-xs text-slate-500">Atur kualifikasi kelas dan fase akademik sesuai kemendikbud</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="select-kurikulum">
                      Kurikulum Nasional
                    </label>
                    <select
                      id="select-kurikulum"
                      value={params.kurikulum}
                      onChange={(e) => setParams({ ...params, kurikulum: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-800"
                    >
                      <option value="Kurikulum Merdeka">Kurikulum Merdeka (Standar Nasional)</option>
                      <option value="Kurikulum KBC">Kurikulum KBC (Kurikulum Berbasis Kompetensi)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="select-jenjang">
                      Jenjang Sekolah
                    </label>
                    <select
                      id="select-jenjang"
                      value={params.jenjang}
                      onChange={(e) => setParams({ ...params, jenjang: e.target.value as any })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-800"
                    >
                      <option value="PAUD/TK">PAUD / TK</option>
                      <option value="SD/MI">SD / MI</option>
                      <option value="SMP/MTs">SMP / MTs</option>
                      <option value="SMA/MA/SMK">SMA / MA / SMK</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="select-fase">
                      Fase Kurikulum
                    </label>
                    <select
                      id="select-fase"
                      value={params.fase}
                      onChange={(e) => setParams({ ...params, fase: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-800"
                    >
                      {PEMETAAN_AKADEMIK[params.jenjang].fase.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="select-kelas">
                      Kelas
                    </label>
                    <select
                      id="select-kelas"
                      value={params.kelas}
                      onChange={(e) => setParams({ ...params, kelas: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-800"
                    >
                      {PEMETAAN_AKADEMIK[params.jenjang].kelas.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="input-mata-pelajaran">
                      Mata Pelajaran
                    </label>
                    <input
                      type="text"
                      id="input-mata-pelajaran"
                      value={params.mataPelajaran}
                      onChange={(e) => setParams({ ...params, mataPelajaran: e.target.value })}
                      placeholder="Contoh: Matematika, Bahasa Indonesia, Ilmu Pengetahuan Alam (IPA)"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    id="button-next-step"
                    onClick={() => {
                      if (!params.mataPelajaran.trim()) {
                        setErrorText("Silakan isi nama Mata Pelajaran terlebih dahulu.");
                        return;
                      }
                      setErrorText("");
                      setStep(2);
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-semibold rounded-xl flex items-center justify-center space-x-2 shadow-xs cursor-pointer transition-all"
                  >
                    <span>Lanjut ke Langkah 2</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* FORM STEP 2 */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
                id="form-step-2"
              >
                <div className="border-l-4 border-blue-600 pl-3">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" /> C. Struktur dan Cakupan Pembelajaran
                  </h3>
                  <p className="text-xs text-slate-500">Petakan judul materi dan pengaturan sintaks belajar mengajar</p>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="input-materi-pokok">
                      Materi Pokok / Judul Modul Ajar
                    </label>
                    <input
                      type="text"
                      id="input-materi-pokok"
                      value={params.materiPokok}
                      onChange={(e) => setParams({ ...params, materiPokok: e.target.value })}
                      placeholder="Contoh: Pecahan Senilai, Gaya Magnet, Perubahan Wujud Zat"
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-800"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="input-jumlah-pertemuan">
                        Jumlah Pertemuan
                      </label>
                      <input
                        type="number"
                        id="input-jumlah-pertemuan"
                        value={params.jumlahPertemuan}
                        onChange={(e) => setParams({ ...params, jumlahPertemuan: Math.max(1, parseInt(e.target.value) || 1) })}
                        min="1"
                        placeholder="Contoh: 2"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="input-lama-pertemuan">
                        Alokasi Waktu per Pertemuan
                      </label>
                      <input
                        type="text"
                        id="input-lama-pertemuan"
                        value={params.lamaPertemuan}
                        onChange={(e) => setParams({ ...params, lamaPertemuan: e.target.value })}
                        placeholder="Contoh: 2 x 35 Menit"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="input-capaian-pembelajaran">
                      Capaian Pembelajaran (CP)
                    </label>
                    <textarea
                      id="input-capaian-pembelajaran"
                      value={params.capaianPembelajaran}
                      onChange={(e) => setParams({ ...params, capaianPembelajaran: e.target.value })}
                      rows={2}
                      placeholder="Contoh: Peserta didik mampu menganalisis hubungan gaya dengan gerak benda."
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-800 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="input-tujuan-pembelajaran">
                      Tujuan Pembelajaran (TP)
                    </label>
                    <textarea
                      id="input-tujuan-pembelajaran"
                      value={params.tujuanPembelajaran}
                      onChange={(e) => setParams({ ...params, tujuanPembelajaran: e.target.value })}
                      rows={2}
                      placeholder="Contoh: Mengidentifikasi kutub magnet, mendemonstrasikan gaya tarik menarik magnet."
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-800 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="select-model-pembelajaran">
                      Model Pembelajaran
                    </label>
                    <select
                      id="select-model-pembelajaran"
                      value={params.modelPembelajaran}
                      onChange={(e) => setParams({ ...params, modelPembelajaran: e.target.value })}
                      className="w-full px-4 py-3 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all text-sm text-slate-800"
                    >
                      <option value="Problem Based Learning (PBL)">Problem Based Learning (PBL)</option>
                      <option value="Project Based Learning (PjBL)">Project Based Learning (PjBL)</option>
                      <option value="Discovery / Inquiry Learning">Discovery / Inquiry Learning</option>
                      <option value="Cooperative Learning">Cooperative Learning</option>
                      <option value="Tatap Muka / Ceramah Interaktif">Tatap Muka / Ceramah Interaktif</option>
                    </select>
                  </div>
                </div>

                <div className="border-l-4 border-blue-600 pl-3 pt-2">
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-1.5" id="dimensi-section-title">
                    <Calendar className="w-4 h-4 text-blue-600" /> D. Dimensi Profil Lulusan <span className="text-xs font-normal text-slate-500">(Bisa Pilih Multi)</span>
                  </h3>
                  <p className="text-xs text-slate-500">Pilih nilai karakter Pancasila yang diperkuat pada modul ajar ini:</p>
                </div>

                {/* Dimensions selection grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2" id="dimensi-cards-grid">
                  {DIMENSI_LIST.map((dimensi) => {
                    const isActive = params.dimensiLulusan.includes(dimensi.nama);
                    return (
                      <button
                        type="button"
                        key={dimensi.id}
                        id={`dimensi-card-${dimensi.id}`}
                        onClick={() => toggleDimensi(dimensi.nama)}
                        className={`p-3 rounded-xl border text-center transition-all flex flex-col justify-center items-center gap-1 cursor-pointer h-20 ${
                          isActive
                            ? "border-blue-600 bg-blue-50/70 text-blue-950 shadow-xs"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <span className={`text-[11px] font-bold tracking-wide ${isActive ? "text-blue-700" : "text-slate-600"}`}>
                          {dimensi.nama}
                        </span>
                        <span className="text-[9px] text-slate-400 line-clamp-2 md:block hidden px-1 text-center font-normal leading-tight">
                          {dimensi.deskripsi}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Additional Teacher Catatan / Notes */}
                <div className="pt-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2" htmlFor="textarea-catatan">
                    Catatan Kustom Guru / Instruksi Tambahan (Opsional)
                  </label>
                  <textarea
                    id="textarea-catatan"
                    value={params.catatanTambahan}
                    onChange={(e) => setParams({ ...params, catatanTambahan: e.target.value })}
                    rows={2}
                    placeholder="Contoh: Siswa akan membawa alat penggaris sendiri. Hubungkan ilustrasi pembuka dengan kebudayaan gotong royong warga desa."
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-slate-800 resize-none"
                  ></textarea>
                </div>

                {/* Document Type choices with intuitive banners */}
                <div className="border-l-4 border-blue-600 pl-3 pt-2">
                  <h3 className="font-bold text-slate-900 text-base">E. Format Output yang Diinginkan</h3>
                  <p className="text-xs text-slate-500">Pilih berkas administratif yang ingin digenerate:</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3" id="output-types-grid">
                  <button
                    type="button"
                    onClick={() => setParams({ ...params, tipeDokumen: "modul" })}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      params.tipeDokumen === "modul"
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-500"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <BookOpen className={`w-5 h-5 ${params.tipeDokumen === "modul" ? "text-indigo-600" : "text-slate-400"}`} />
                    <span className="text-xs font-bold leading-none">Modul Utama</span>
                    <span className="text-[9px] text-slate-400 font-normal">RPP Lengkap</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setParams({ ...params, tipeDokumen: "lkpd" })}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      params.tipeDokumen === "lkpd"
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-500"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <FileSpreadsheet className={`w-5 h-5 ${params.tipeDokumen === "lkpd" ? "text-indigo-600" : "text-slate-400"}`} />
                    <span className="text-xs font-bold leading-none">LKPD Siswa</span>
                    <span className="text-[9px] text-slate-400 font-normal">Kerja Praktik</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setParams({ ...params, tipeDokumen: "asesmen" })}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      params.tipeDokumen === "asesmen"
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-500"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <CheckSquare className={`w-5 h-5 ${params.tipeDokumen === "asesmen" ? "text-indigo-600" : "text-slate-400"}`} />
                    <span className="text-xs font-bold leading-none">Format Asesmen</span>
                    <span className="text-[9px] text-slate-400 font-normal">Rubrik & Kisi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setParams({ ...params, tipeDokumen: "bahan_ajar" })}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      params.tipeDokumen === "bahan_ajar"
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-950 ring-1 ring-indigo-500"
                        : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <Clock className={`w-5 h-5 ${params.tipeDokumen === "bahan_ajar" ? "text-indigo-600" : "text-slate-400"}`} />
                    <span className="text-xs font-bold leading-none">Bahan Bacaan</span>
                    <span className="text-[9px] text-slate-400 font-normal">Glosari & Teori</span>
                  </button>
                </div>

                {/* Footer buttons Step 2 */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setErrorText("");
                      setStep(1);
                    }}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer text-sm"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={clearForm}
                      className="px-3.5 py-3 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-700 active:scale-95 transition-all cursor-pointer text-xs font-semibold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Bersihkan
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerate}
                      disabled={loading}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-md cursor-pointer transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Buat Dokumen Sekarang</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </section>

          {/* RIGHT PANEL: Document output preview & Historic workspace */}
          <section className="lg:col-span-5 flex flex-col gap-6" id="outputs-panel">
            
            {/* Real-time document rendering screen */}
            <div className="bg-white text-slate-800 p-5 rounded-2xl shadow-md flex flex-col min-h-[550px] lg:min-h-[640px] border border-slate-200" id="output-preview-box">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100" id="preview-box-header">
                <div className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-rose-500"></span>
                  <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                  <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                  <span className="text-xs text-slate-500 font-mono ml-2">Preview_Merdeka_AI.md</span>
                </div>

                <div className="flex items-center space-x-2">
                  {/* View mode buttons */}
                  {outputText && (
                    <div className="bg-slate-100 border border-slate-200 p-0.5 rounded-lg flex items-center space-x-px mr-1">
                      <button
                        onClick={() => setViewMode("formatted")}
                        className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${
                          viewMode === "formatted"
                            ? "bg-white text-slate-800 shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Format
                      </button>
                      <button
                        onClick={() => setViewMode("raw")}
                        className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-bold rounded-md transition-all ${
                          viewMode === "raw"
                            ? "bg-white text-slate-800 shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        Raw
                      </button>
                    </div>
                  )}

                  {/* Copy button */}
                  <button
                    disabled={!outputText || loading}
                    onClick={copyToClipboard}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-slate-900 rounded-lg transition-all border border-slate-200 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  {/* Download button */}
                  <button
                    disabled={!outputText || loading}
                    onClick={downloadMarkdown}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-650 hover:text-slate-900 rounded-lg transition-all border border-slate-200 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Loader with Indonesian messages */}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-grow flex flex-col items-center justify-center text-center p-6"
                    id="preview-loading-spinner"
                  >
                    <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                    <p className="text-slate-700 font-medium text-sm transition-all duration-300">
                      {ENCOURAGING_TIPS[loaderMessageIndex]}
                    </p>
                    <p className="text-xs text-slate-400 mt-2">Dibutuhkan beberapa detik karena draf dibuat secara detail dan kontekstual</p>
                  </motion.div>
                ) : outputText ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex-grow overflow-y-auto max-h-[480px] lg:max-h-[560px] pr-2 custom-scrollbar text-slate-800"
                    id="preview-output-content"
                  >
                    {/* Header bar of Generated File */}
                    <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between text-[11px] text-slate-500">
                      <div>
                        <span className="font-bold text-slate-700 uppercase tracking-wide">Format:</span>{" "}
                        {getDocumentTypeTitle(params.tipeDokumen)}
                      </div>
                      <button
                        onClick={() => window.print()}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-all cursor-pointer font-bold"
                      >
                        <Printer className="w-3 h-3" /> Cetak PDF
                      </button>
                    </div>

                    {/* Fallback Warning Alert Banner */}
                    {isFallback && (
                      <div className="mb-5 p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs sm:text-sm flex flex-col gap-3 shadow-xs text-left" id="fallback-engine-notice">
                        <div className="font-bold flex items-center gap-2 text-amber-800">
                          <AlertCircle className="w-5 h-5 text-amber-600 animate-pulse shrink-0" />
                          <span>Kunci API Gemini Kedaluwarsa / Belum Terpasang (Beralih Ke Mode Pendukung Lokalan)</span>
                        </div>
                        <div className="text-slate-700 space-y-2 leading-relaxed text-xs sm:text-[13px]">
                          <p>
                            Sistem mendeteksi bahwa format kredensial kunci <strong>Gemini API Key Anda saat ini tidak valid, kedaluwarsa, atau telah habis masa aktifnya</strong>. Anda dapat memperbarui/memasukkan kunci API yang baru kapan saja melalui menu <strong>Settings (ikon roda gigi kanan atas) &gt; Secrets</strong> di AI Studio untuk memulihkan generasi draf berbasis AI secara penuh.
                          </p>
                          <div className="font-medium text-[#2d3a1a] bg-[#f5fbf0] border border-[#d6e9c6] p-3 rounded-lg flex items-start gap-2">
                            <span className="shrink-0 text-[14px]">💡</span>
                            <span><strong>Generator Mandiri Aktif:</strong> Sebagai bentuk proteksi sistem agar administrasi Anda tidak terhambat, draf dokumen di bawah ini berhasil dibuat secara instan oleh <strong>Sistem Generator Kurikulum Terbuka Mandiri</strong> dengan presisi tinggi dan struktur tabel kurikulum yang 100% bersih, lengkap, serta siap digunakan!</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* View Modes */}
                    {viewMode === "formatted" ? (
                      <div 
                        className={`prose prose-sm max-w-none text-left ${
                          params.tipeDokumen === "asesmen" ? "academic-print-mode" : ""
                        }`} 
                        id="formatted-markdown-renderer"
                      >
                        <ReactMarkdown
                          components={{
                            h1: ({ children, ...props }) => {
                              const text = React.Children.toArray(children).join("");
                              const isHeaderDoc = text.toUpperCase().includes("MODUL AJAR") || 
                                                  text.toUpperCase().includes("LEMBAR KERJA") || 
                                                  text.toUpperCase().includes("ASESMEN") || 
                                                  text.toUpperCase().includes("LAMPIRAN") || 
                                                  text.toUpperCase().includes("BAHAN AJAR");
                              
                              if (isHeaderDoc) {
                                return (
                                  <div className="text-center my-6 p-6 border-2 border-dashed border-[#bacc9a] bg-[#fafdf7] rounded-2xl shadow-xs space-y-4 max-w-xl mx-auto" id="cover-page-view">
                                    <div className="flex justify-center mb-1">
                                      <div className="w-16 h-16 rounded-full bg-white border-2 border-[#556b2f] flex items-center justify-center shadow-inner relative">
                                        <svg viewBox="0 0 100 100" className="w-10 h-10 text-sky-600 fill-current">
                                          <circle cx="50" cy="50" r="42" className="text-sky-500 fill-transparent stroke-[3]" />
                                          <path d="M50 20 L75 35 L75 65 L50 80 L25 65 L25 35 Z" fill="#1e3a8a" />
                                          <polygon points="50,28 53,38 64,38 56,45 59,56 50,49 41,56 44,45 36,38 47,38" fill="#facc15" />
                                          <path d="M25,50 Q50,75 75,50" className="text-white fill-transparent stroke-2" />
                                        </svg>
                                      </div>
                                    </div>
                                    <div className="bg-[#556b2f] text-white font-extrabold text-sm sm:text-base py-3 px-4 rounded-xl tracking-wider uppercase leading-snug drop-shadow-xs">
                                      {text}
                                    </div>
                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold font-mono">DOKUMEN PORTAL RESMI AKADEMIK</p>
                                  </div>
                                );
                              }
                              return <h1 className="text-lg font-bold text-slate-900 mt-6 mb-3 border-b border-slate-100 pb-1.5 uppercase tracking-wide" {...props}>{children}</h1>;
                            },
                            h2: ({ ...props }) => (
                              <h2 className="text-md font-bold text-indigo-700 mt-5 mb-2.5" {...props} />
                            ),
                            h3: ({ ...props }) => (
                              <h3 className="text-sm font-semibold text-sky-700 mt-4 mb-2" {...props} />
                            ),
                            p: ({ ...props }) => (
                              <p className="text-[13px] text-slate-650 leading-relaxed mb-3 text-justify font-sans" {...props} />
                            ),
                            ul: ({ ...props }) => (
                              <ul className="list-disc pl-5 mb-3 text-[13px] space-y-1 text-slate-650" {...props} />
                            ),
                            ol: ({ ...props }) => (
                              <ol className="list-decimal pl-5 mb-3 text-[13px] space-y-1 text-slate-650" {...props} />
                            ),
                            li: ({ ...props }) => <li className="mb-0.5" {...props} />,
                            table: ({ children, ...props }) => {
                              const childrenString = JSON.stringify(children).toLowerCase();
                              const isRefleksiTable = childrenString.includes("pendekatan/strategi") ||
                                                      childrenString.includes("refleksi");
                              const isRubrikTable = childrenString.includes("sangat baik") || 
                                                    childrenString.includes("perlu perbaikan") ||
                                                    childrenString.includes("kriteria aspek") ||
                                                    childrenString.includes("tahap 1");
                              
                              if (isRefleksiTable) {
                                return (
                                  <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                                    <table className="w-full text-left text-[11px] border-collapse refleksi-guru-table-styled" {...props}>
                                      {children}
                                    </table>
                                  </div>
                                );
                              }
                              
                              if (isRubrikTable) {
                                return (
                                  <div className="overflow-x-auto my-4 bg-white">
                                    <table className="w-full text-left text-[12px] border-collapse rubrik-penilaian-table-styled" {...props}>
                                      {children}
                                    </table>
                                  </div>
                                );
                              }
                              
                              return (
                                <div className="overflow-x-auto my-4 rounded-xl border border-slate-200 bg-white shadow-xs">
                                  <table className="w-full text-left text-[11px] border-collapse text-slate-755" {...props}>
                                    {children}
                                  </table>
                                </div>
                              );
                            },
                            th: ({ ...props }) => (
                              <th className="px-3 py-2 bg-slate-100 border border-slate-200 font-bold text-slate-800 uppercase tracking-wider" {...props} />
                            ),
                            td: ({ ...props }) => (
                              <td className="px-3 py-1.5 border border-slate-200 text-slate-650" {...props} />
                            ),
                            blockquote: ({ children, ...props }) => {
                              const textContent = React.Children.toArray(children)
                                .map((child) => (typeof child === "string" || typeof child === "number" ? child : ""))
                                .join("")
                                .toLowerCase();
                              
                              const isWarning = textContent.includes("perhatian") || 
                                                textContent.includes("kedaluwarsa") || 
                                                textContent.includes("expired") || 
                                                textContent.includes("warning") || 
                                                textContent.includes("api key") || 
                                                textContent.includes("koneksi") ||
                                                textContent.includes("sibuk");

                              if (isWarning) {
                                return (
                                  <blockquote className="border-l-4 border-amber-500 pl-4 bg-amber-50/60 p-4 text-slate-700 text-[12px] my-5 rounded-r-xl shadow-xs leading-relaxed" {...props}>
                                    {children}
                                  </blockquote>
                                );
                              }

                              return (
                                <blockquote className="border-l-4 border-[#556b2f] pl-3 bg-slate-50 py-1.5 px-3 italic text-slate-650 text-xs my-3 rounded-r-lg" {...props}>
                                  {children}
                                </blockquote>
                              );
                            }
                          }}
                        >
                          {outputText}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <textarea
                        readOnly
                        value={outputText}
                        id="raw-text-view"
                        className="w-full h-[400px] lg:h-[480px] bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 focus:outline-none resize-none"
                      />
                    )}
                  </motion.div>
                ) : (
                  <div className="flex-grow flex flex-col items-center justify-center text-center p-6 text-slate-400" id="preview-box-empty">
                    <FileText className="w-12 h-12 text-slate-300 mb-3" />
                    <p className="text-sm font-semibold text-slate-500">Belum ada dokumen yang dibuat</p>
                    <p className="text-xs text-slate-400 mt-1 max-w-[280px]">
                      Isilah form formulir di langkah kiri kemudian klik tombol hijau untuk merancang modul mengajar Anda secara instan.
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* Teaching Modules History Logs */}
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs" id="history-box">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <History className="w-4 h-4 text-slate-400" /> Riwayat Penyusunan Lokal ({historyList.length})
              </h4>

              {historyList.length > 0 ? (
                <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1" id="history-listings">
                  {historyList.map((item) => {
                    const isSelected = selectedHistoryId === item.id;
                    return (
                      <div
                        key={item.id}
                        id={`history-item-${item.id}`}
                        onClick={() => loadHistoryItem(item)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-3 ${
                          isSelected
                            ? "bg-blue-50/70 border-blue-400"
                            : "bg-slate-50/60 hover:bg-slate-100 border-slate-100"
                        }`}
                      >
                        <div className="flex-grow min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-700 font-bold rounded-md uppercase">
                              {item.params.tipeDokumen}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-memo">{item.timestamp}</span>
                          </div>
                          <h5 className="text-xs font-bold text-slate-900 truncate">
                            {item.params.materiPokok || "[Materi Kosong]"}
                          </h5>
                          <p className="text-[10px] text-slate-500 truncate">
                            {item.params.mataPelajaran} &bull; {item.params.kelas}
                          </p>
                        </div>

                        <button
                          onClick={(e) => deleteHistoryItem(item.id, e)}
                          id={`history-delete-${item.id}`}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-all rounded-lg hover:bg-slate-100 cursor-pointer"
                          title="Hapus riwayat ini"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-4 italic border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                  Belum ada draf modul yang tersimpan di browser ini.
                </p>
              )}
            </div>

          </section>

        </div>
      </main>
    </div>
  );
}
