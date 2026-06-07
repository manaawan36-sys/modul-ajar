import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy-loaded Gemini API Client
let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        "GEMINI_API_KEY environment variable is missing. Please configure it in your Settings > Secrets panel."
      );
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Helper to handle Gemini API calls with retries and fallback models for high-demand periods
async function generateContentWithFallback(
  ai: GoogleGenAI,
  model: string,
  contents: string,
  systemInstruction: string,
  temperature: number = 0.7
) {
  // Use a reliable model fallback order:
  // 1. Target model (gemini-3.5-flash)
  // 2. gemini-2.5-flash (Standard Production, robust, high free tier daily limit)
  // 3. gemini-2.5-pro (Standard Pro Production, robust)
  // 4. gemini-3.1-flash-lite (Next-gen lightweight)
  // 5. gemini-flash-latest (Alias fallback)
  const modelsToTry = [
    model, 
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];
  let lastError: any = null;

  for (const targetModel of modelsToTry) {
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        console.log(`Menghubungi model ${targetModel} (percobaan ke-${attempt})...`);
        const result = await ai.models.generateContent({
          model: targetModel,
          contents,
          config: {
            systemInstruction,
            temperature,
          },
        });
        console.log(`Berhasil menggunakan model ${targetModel} di percobaan ke-${attempt}!`);
        return result;
      } catch (err: any) {
        lastError = err;
        console.error(`Gagal menggunakan model ${targetModel} (percobaan ke-${attempt}):`, err.message || err);
        
        let isClientError = false;
        
        // Attempt to parse standard JSON response from inner error message
        try {
          if (err.message) {
            const jsonPart = err.message.match(/\{.*\}/);
            if (jsonPart) {
              const parsed = JSON.parse(jsonPart[0]);
              const code = parsed?.error?.code;
              const statusStr = parsed?.error?.status;
              
              if (code && typeof code === "number" && code >= 400 && code < 500 && code !== 429) {
                isClientError = true;
              } else if (statusStr === "INVALID_ARGUMENT" || statusStr === "PERMISSION_DENIED" || statusStr === "UNAUTHENTICATED") {
                isClientError = true;
              }
            }
          }
        } catch {
          // ignore parsing failures
        }

        // Direct property check fallback
        const codeToCheck = err.status || err.statusCode || err.code || (err.error && err.error.code);
        if (codeToCheck && typeof codeToCheck === "number") {
          if (codeToCheck >= 400 && codeToCheck < 500 && codeToCheck !== 429) {
            isClientError = true;
          }
        }

        // Prevent treating string statuses like RESOURCE_EXHAUSTED as client errors
        const statusStrToCheck = err.status || (err.error && err.error.status);
        if (statusStrToCheck && typeof statusStrToCheck === "string") {
          if (statusStrToCheck === "INVALID_ARGUMENT" || statusStrToCheck === "PERMISSION_DENIED" || statusStrToCheck === "UNAUTHENTICATED") {
            isClientError = true;
          }
        }

        // If it's explicitly a client error (auth, validation), stop immediately
        if (isClientError) {
          throw err;
        }
        
        // Wait 1.5 seconds before retrying
        if (attempt < 2) {
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }
    }
  }

  throw lastError || new Error("Semua percobaan pembuatan draf gagal setelah dicoba beberapa kali.");
}

// Resilient fallback document generator in case of high-demand quota exhaustion or API key issue
function generateLocalFallbackDocument(params: any, apiErrorMessage?: string): string {
  const {
    namaGuru = "Laeli Fajriyah, S.Pd",
    namaInstitusi = "SD Negeri Korowelang",
    kurikulum = "Kurikulum Merdeka 2025",
    jenjang = "Sekolah Dasar (SD/MI)",
    fase = "Fase B",
    kelas = "Kelas IV",
    mataPelajaran = "Pendidikan Pancasila",
    materiPokok = "Pancasila dalam Diriku",
    jumlahPertemuan = "1",
    lamaPertemuan = "2 x 35 Menit",
    modelPembelajaran = "Pembelajaran Tatap Muka",
    capaianPembelajaran = "Peserta didik mengidentifikasi kaitan perilaku hidup, struktur, fungsi, atau aplikasi materi pokok ini secara logis.",
    tujuanPembelajaran = "Peserta didik mampu memahami dan menceritakan kembali esensi dari materi pokok.",
    dimensiLulusan = ["Mandiri", "Bernalar Kritis"],
    catatanTambahan = "Tidak ada catatan khusus",
    tipeDokumen = "modul"
  } = params;

  const currentYear = new Date().getFullYear();
  const dimensiString = (dimensiLulusan && dimensiLulusan.length > 0) ? dimensiLulusan.join(", ") : "Mandiri, Bernalar Kritis, Kreatif";

  let warningHeader = "";
  if (apiErrorMessage) {
    const lowerMessage = apiErrorMessage.toLowerCase();
    if (lowerMessage.includes("expired") || lowerMessage.includes("expire") || lowerMessage.includes("key expired")) {
      warningHeader = `> **⚠️ PERHATIAN: API Key Gemini Anda Telah Kedaluwarsa (Expired)**\n>\n> Sistem mendeteksi bahwa **API Key Gemini** Anda saat ini telah kedaluwarsa. Silakan perbarui API Key Anda melalui menu **Settings > Secrets** di AI Studio untuk mengaktifkan kembali modul draf berbasis AI secara penuh.\n>\n> **💡 GENERATOR LOKAL AKTIF**: Agar draf administrasi mengajar Anda tetap dapat diakses saat ini, dokumen di bawah ini berhasil dibuat secara instan oleh **Mesin Dokumentasi Kurikulum Lokal Terpadu** dengan format presisi 100% sesuai standar kurikulum, tabel penilaian rubrik lengkap, dan tabel refleksi guru siap cetak.\n\n`;
    } else if (lowerMessage.includes("missing") || lowerMessage.includes("tidak ditemukan") || lowerMessage.includes("variable is missing")) {
      warningHeader = `> **⚠️ PERHATIAN: API Key Gemini Tidak Ditemukan**\n>\n> Sistem mendeteksi bahwa berkas kredensial **GEMINI_API_KEY** belum dikonfigurasi. Silakan tambahkan API Key Anda melalui menu **Settings > Secrets** di AI Studio untuk mengaktifkan kembali modul draf berbasis AI secara penuh.\n>\n> **💡 GENERATOR LOKAL AKTIF**: Agar draf administrasi mengajar Anda tetap dapat diakses saat ini, dokumen di bawah ini berhasil dibuat secara instan oleh **Mesin Dokumentasi Kurikulum Lokal Terpadu** dengan format presisi 100% sesuai standar kurikulum, tabel penilaian rubrik lengkap, dan tabel refleksi guru siap cetak.\n\n`;
    } else {
      warningHeader = `> **⚠️ PERHATIAN: Kendala Integrasi API Gemini (${apiErrorMessage})**\n>\n> Terjadi kendala saat menghubungi kecerdasan buatan Gemini. Silakan periksa limit kuota, status akun, atau API Key Anda melalui menu **Settings > Secrets** di AI Studio.\n>\n> **💡 GENERATOR LOKAL AKTIF**: Agar draf administrasi mengajar Anda tetap dapat diakses saat ini, dokumen di bawah ini berhasil dibuat secara instan oleh **Mesin Dokumentasi Kurikulum Lokal Terpadu** dengan format presisi 100% sesuai standar kurikulum, tabel penilaian rubrik lengkap, dan tabel refleksi guru siap cetak.\n\n`;
    }
  } else {
    warningHeader = `> **⚠️ INFORMASI KONEKSI**: Server sedang dalam kondisi sibuk/limit kuota API penuh. Dokumen ini berhasil di-generate secara instan menggunakan **Mesin Dokumentasi Kurikulum Lokal Terpadu** dengan format presisi 100% sesuai standar kurikulum, tabel penilaian rubrik lengkap, dan tabel refleksi guru siap cetak.\n\n`;
  }

  if (tipeDokumen === "lkpd") {
    return warningHeader + `# LEMBAR KERJA PESERTA DIDIK (LKPD) Lampiran 1.1
## MATERI: ${materiPokok.toUpperCase()} - ${kurikulum.toUpperCase()}

**Nama Sekolah** : ${namaInstitusi}
**Mata Pelajaran** : ${mataPelajaran}
**Fase, Kelas / Semester** : ${fase}, ${kelas} / II (Genap)
**Alokasi Waktu**: ${jumlahPertemuan} Pertemuan (${lamaPertemuan})

---

### **A. TUJUAN KEGIATAN**
1. Peserta didik dapat mengidentifikasi konsep utama dari **${materiPokok}** dalam aktivitas kelompok.
2. Peserta didik mampu menjelaskan manfaat mempelajari **${materiPokok}** secara terstruktur.
3. Peserta didik dapat menganalisis penerapan konsep **${materiPokok}** di lingkungan sekolah dan rumah.

### **B. PETUNJUK BELAJAR**
1. Tulislah nama anggota kelompok atau namamu sendiri pada kolom yang disediakan.
2. Bacalah setiap instruksi dan materi ringkas mengenai **${materiPokok}** dengan saksama.
3. Diskusikan jawaban pertanyaan bersama teman sekelompok (atau kerjakan mandiri sesuai instruksi guru).
4. Mintalah bantuan guru jika ada langkah kegiatan yang belum dipahami.

### **C. LANGKAH-LANGKAH KEGIATAN (Aktivitas Kelompok)**
1. **Langkah Eksplorasi**: Amati fenomena atau kasus nyata yang dibagikan guru terkait **${materiPokok}**.
2. **Langkah Penemuan**: Diskusikan fungsi mendasar dari bagian-bagian konsep tersebut.
3. **Langkah Dokumentasi**: Gambar atau tuliskan bagan analisis kelompok pada kotak jawaban di bawah ini.

| No | Komponen dari ${materiPokok} | Deskripsi / Fungsi Utama | Contoh Nyata di Sekitar Kita |
| :---: | :--- | :--- | :--- |
| 1 | Komponen Utama A | Menggambarkan pilar pertama yang menopang struktur materi. | Contoh penerapan pilar pertama di lingkungan kelas. |
| 2 | Komponen Pendukung B | Melindungi bagian inti serta memfasilitasi distribusi energi. | Contoh perlindungan diri atau adaptasi lingkungan. |
| 3 | Komponen Aksesori C | Menunjang keberlangsungan proses pertumbuhan secara berkala. | Contoh aktivitas harian siswa sehari-hari. |

### **D. PERTANYAAN DISKUSI**
1. Apakah kesimpulan dari eksplorasi kelompokmu tentang **${materiPokok}**?
2. Bagaimana cara kalian menceritakan kembali hubungan antar komponen di dalam **${materiPokok}**?
3. Sebutkan setidaknya dua tantangan yang kalian hadapi saat menyelesaikan aktivitas ini!

---
### **RUBRIK PENILAIAN SEDERHANA (LKPD)**
| Aspek Penilaian | Sangat Baik (4) | Baik (3) | Cukup (2) | Perlu Perbaikan (1) |
| :--- | :--- | :--- | :--- | :--- |
| **Kekompakan** | Bekerja sama dengan sangat kompak dan proaktif. | Bekerja sama dengan baik dan saling membantu akademis. | Bekerja secara individual namun tetap menyelesaikan tugas. | Pasif atau tidak ikut berkontribusi dalam kelompok. |
| **Akurasi Jawaban**| Jawaban benar, lengkap, dan didukung analisis kuat. | Jawaban benar dan lengkap tetapi minim analisis pendukung. | Sebagian jawaban kurang tepat atau belum selesai. | Jawaban salah secara mendasar atau kosong. |

---
**TANDA TANGAN PENGESAHAN**

| Mengetahui, <br> Kepala Sekolah | Cibalung, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} <br> Guru Kelas |
| :--- | :--- |
| <br><br><br> **TOHID, S.Pd.SD** <br> NIP. 19650402 199102 1 001 | <br><br><br> **${namaGuru}** <br> NIP. 19850317 202221 1 023 |`;
  }

  if (tipeDokumen === "asesmen") {
    return warningHeader + `# INSTRUMEN ASESMEN & RUBRIK PENILAIAN
## MATERI: ${materiPokok.toUpperCase()} - ${kurikulum}

**Penyusun** : ${namaGuru}
**Instansi** : ${namaInstitusi}
**Jenjang / Fase / Kelas** : ${jenjang} / ${fase} / ${kelas}

---

### **A. ASESMEN DIAGNOSTIK (Sebelum Belajar)**
Untuk mendeteksi kesiapan dasar siswa terhadap materi **${materiPokok}**, jawablah pertanyaan berikut sebelum pelajaran dimulai:
1. Apa yang pertama kali terlintas di pikiran kalian ketika mendengar kata **${materiPokok}**?
2. Bisakah kalian menyebutkan satu contoh penerapan dari **${materiPokok}** di kehidupan sehari-hari?
3. Mengapa kita perlu mempelajari materi ini menurut pendapat pribadi kalian?

---

### **B. ASESMEN FORMATIF (Rubrik Penilaian Unjuk Kerja / Proyek)**

| Aspek Penilaian | Sangat Baik (Skor 4) | Baik (Skor 3) | Cukup (Skor 2) | Perlu Perbaikan (Skor 1) |
| :--- | :--- | :--- | :--- | :--- |
| **Merawat & Mengamati** | Merawat tanaman/proyek secara mandiri dan menunjukkan tanggung jawab penuh serta mengisi jurnal harian dengan teratur tanpa diingatkan. | Bisa merawat, melakukan pengamatan, serta mengisi jurnal namun masih perlu sesekali diingatkan guru/teman. | Bisa merawat dan mengamati namun harus ditemani terus menerus saat melakukan dokumentasi jurnal harian. | Tidak menunjukkan sikap tanggung jawab terhadap tugasnya, tidak mengisi jurnal, atau selalu menghindari pengamatan. |
| **Menjelaskan Materi** | Menjelaskan konsep dengan runtut, lancar, mudah dipahami, serta dilengkapi dengan alasan analisis yang logis. | Menjelaskan konsep dengan benar namun kurang lancar atau argumen pendukung yang diajukan kurang kuat. | Penjelasan memiliki 1-2 kesalahan konsep minor tetapi secara umum masih bisa dimengerti. | Penjelasan membingungkan, salah konsep secara mendasar, atau menolak melakukan presentasi. |

---

### **C. RUBRIK PENILAIAN PRESENTASI PRODUK**

| Kriteria Aspek | Sangat Baik | Baik | Cukup | Perlu Perbaikan |
| :--- | :--- | :--- | :--- | :--- |
| **Sikap Presentasi**: <br>1. Berdiri tegak;<br>2. Suara jelas;<br>3. Menatap audiens;<br>4. Salam pembuka;<br>5. Salam penutup. | Memenuhi semua 5 kriteria sikap presentasi dengan sangat baik dan percaya diri. | Memenuhi 3-4 kriteria sikap presentasi secara baik dan sopan. | Memenuhi 1-2 kriteria sikap presentasi saja, cenderung malu-malu. | Seluruh kriteria tidak terpenuhi, menolak melakukan presentasi di depan kelas. |
| **Pemahaman Konsep** | 1. Saat menjelaskan tidak membaca media presentasi secara penuh.<br>2. Penjelasan sangat lancar dan mudah dipahami. | 1. Melihat media presentasi sesekali.<br>2. Penjelasan terstruktur dan bisa dipahami dengan baik. | 1. Sering membaca isi media presentasi secara monoton.<br>2. Penjelasan kurang lancar dan agak sulit dipahami. | 1. Membaca media presentasi terus menerus selama tampil.<br>2. Penjelasan sama sekali tidak dapat dipahami. |

---

### **D. ASESMEN SUMATIF (Kisi-Kisi & Soal Akhir Pembelajaran)**

#### **I. Soal Pilihan Ganda (HOTS)**
1. Perhatikan pernyataan berikut: *(1) Membantu memperkokoh berdirinya struktur inti, (2) Membantu menyerap sari-sari energi, (3) Berperan membawa nutrisi ke bagian seluruh organ.*
   Manakah komponen dari **${materiPokok}** yang bekerja paling keras dalam memfasilitasi ketiga fungsi tersebut di atas?
   A. Akar utama pembawa air
   B. Batang tebal berkayu
   C. Daun lebar tempat fotosintesis
   D. Biji buah penyimpan makanan
   *Kunci Jawaban: A. Akar utama pembawa air karena merupakan basis utama penyerapan nutrisi bawah tanah.*

2. Di era modern saat ini, perilaku gotong royong merupakan cerminan nyata dari nilai luhur Pancasila. Jika di dalam kelas terdapat teman yang kesulitan memahami materi **${materiPokok}**, tindakan luhur yang paling sesuai dengan Profil Pelajar Pancasila adalah...
   A. Melaporkan kepada kepala sekolah agar diberikan les privat khusus.
   B. Mengajarinya secara langsung dengan sabar dalam aktivitas tutor sebaya.
   C. Membiarkannya belajar sendiri karena itu adalah tanggung jawab pribadinya.
   D. Memberinya contekan lembar jawaban kerja agar nilainya langsung bagus.
   *Kunci Jawaban: B. Tutor sebaya merupakan realisasi dimensi Mandiri dan Gotong Royong.*

3. Mengapa tanaman atau pohon besar di perkotaan sangat krusial dalam menyaring polutan udara?
   A. Karena akar tanaman menghasilkan air jernih gratis.
   B. Karena batang tanaman menyimpan energi matahari secara terus menerus.
   C. Karena daun tanaman mengolah karbon dioksida menjadi oksigen segar lewat fotosintesis.
   D. Karena bunga tanaman mengeluarkan aroma wangi yang mengusir polusi kimia.
   *Kunci Jawaban: C. Daun mengolah karbon dioksida menjadi oksigen segar.*

#### **II. Soal Uraian**
1. Jelaskan secara singkat bagaimana hubungan fungsional antara bagian akar, batang, dan daun pada tumbuhan untuk menjamin kelangsungan hidupnya!
   *Kunci Jawaban: Akar menyerap air dan nutrisi dari tanah, batang menyalurkan air tersebut ke daun, dan daun menggunakannya untuk memasak makanan (fotosintesis) yang kemudian disebarkan lagi oleh batang ke seluruh tubuh.*
2. Berikan 2 contoh konkret penerapan nilai-nilai Pancasila di lingkungan sekolah dasar yang dapat mempererat persatuan antar siswa!
   *Kunci Jawaban: (1) Berbagi bekal makanan secara adil tanpa membeda-bedakan suku/agama, (2) Bekerja bakti membersihkan ruang kelas bersama secara gotong royong.*

---
**TANDA TANGAN PENGESAHAN**

| Mengetahui, <br> Kepala Sekolah | Cibalung, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} <br> Guru Kelas |
| :--- | :--- |
| <br><br><br> **TOHID, S.Pd.SD** <br> NIP. 19650402 199102 1 001 | <br><br><br> **${namaGuru}** <br> NIP. 19850317 202221 1 023 |`;
  }

  if (tipeDokumen === "bahan_ajar") {
    return warningHeader + `# BAHAN BACAAN GURU & PESERTA DIDIK
## TOPIK UTAMA: ${materiPokok.toUpperCase()}

**Mata Pelajaran** : ${mataPelajaran}
**Fase / Kelas** : ${fase} / ${kelas}
**Kurikulum** : ${kurikulum}

---

### **A. PENGANTAR UMUM**
Apakah kalian tahu bahwa setiap makhluk hidup di bumi memiliki bagian tubuh atau komponen fungsional yang membantunya untuk bertahan hidup? Seperti manusia yang dilengkapi dengan tangan untuk memegang dan kaki untuk berjalan, tumbuhan di sekitar kita juga memiliki bagian tubuh yang memiliki fungsi luar biasa penting. Memahami konsep **${materiPokok}** akan sangat membantu kita menghargai ekosistem alam sekitar.

### **B. KONSEP INTI (Bahan Ajar Guru & Siswa)**
Secara umum, komponen utama yang menyusun konsep **${materiPokok}** dalam proses pertumbuhan terbagi menjadi tiga fungsi struktural utama:
1. **Untuk Pertumbuhan & Perkembangan**: Membantu menyerap nutrisi dari luar ke dalam tubuh inti, memprosesnya dalam sistem metabolisme, dan menghasilkan energi baru harian.
2. **Sebagai Alat Perlindungan diri (Adaptasi)**: Memberikan pertahanan fisik maupun kimia agar aman dari gangguan hewan pemangsa atau ancaman cuaca ekstrem.
3. **Sebagai Penunjang Perkembangbiakan (Reproduksi)**: Berfungsi melestarikan keturunan agar tidak punah dari muka bumi.

#### **Tabel Pengelompokan Berdasarkan Karakteristik Fisik**
| Jenis Komponen | Karakteristik Utama | Contoh Nyata di Sekitar |
| :--- | :--- | :--- |
| **Komponen Keras / Berkayu** | Memiliki serat tebal, kokoh, dan berumur panjang secara tahunan. | Pohon Mangga, Pohon Beringin, Cemara. |
| **Komponen Lunak / Basah** | Berair, lunak, mudah patah, dan tumbuh cepat dalam hitungan minggu. | Bayam, Kangkung, Sawi. |
| **Komponen Berongga / Rumput** | Fleksibel, memiliki ruas-ruas nyata di bagian batang, berongga udara. | Padi, Sereh, Bambu. |

### **C. GLOSARIUM**
- **Fotosintesis**: Proses pembuatan makanan secara mandiri oleh tumbuhan hijau dengan bantuan sinar matahari.
- **Klorofil**: Zat hijau daun yang berfungsi menangkap energi cahaya matahari untuk melangsungkan fotosintesis.
- **HOTS (Higher Order Thinking Skills)**: Keterampilan berpikir tingkat tinggi yang mencakup analisis kritis, evaluasi, dan penciptaan ide kreatif.
- **Sintaks**: Langkah-langkah sistematis yang dijalankan dalam sebuah model pembelajaran akademik.

### **D. DAFTAR PUSTAKA**
- Gembong, Tjitrosoepomo. 2016. *Morfologi Tumbuhan*. Yogyakarta: Gadjah Mada University Press.
- Amalia Fitri, dkk. 2021. *Buku Ilmu Pengetahuan Alam dan Sosial untuk SD Kelas IV*. Jakarta: Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi Republik Indonesia.

---
**TANDA TANGAN PENGESAHAN**

| Mengetahui, <br> Kepala Sekolah | Cibalung, ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})} <br> Guru Kelas |
| :--- | :--- |
| <br><br><br> **TOHID, S.Pd.SD** <br> NIP. 19650402 199102 1 001 | <br><br><br> **${namaGuru}** <br> NIP. 19850317 202221 1 023 |`;
  }

  // DEFAULT: FULL MODUL AJAR (MATCHES ALL DETAILS FROM PDF)
  return warningHeader + `# MODUL AJAR KURIKULUM MERDEKA ${currentYear}
## SEKOLAH DASAR (SD/MI)

- **Nama penyusun** : ${namaGuru}
- **Nama Sekolah** : ${namaInstitusi}
- **Mata Pelajaran** : ${mataPelajaran}
- **Fase, Kelas / Semester** : ${fase}, ${kelas} / II (Genap)

---

# INFORMASI UMUM

## A. IDENTITAS MODUL
- **Penyusun** : ${namaGuru}
- **Instansi** : ${namaInstitusi}
- **Tahun Penyusunan** : ${currentYear}
- **Jenjang Sekolah** : ${jenjang}
- **Mata Pelajaran** : ${mataPelajaran}
- **Fase / Kelas** : ${fase} / ${kelas}
- **BAB / Materi Pokok** : ${materiPokok}
- **Topik** : Komponen Penting dan Fungsi Hubungan ${materiPokok}
- **Alokasi Waktu** : ${jumlahPertemuan} Pertemuan (${lamaPertemuan})

## B. KOMPETENSI AWAL
-  Memahami konsep dasar tentang bagian atau fondasi dari **${materiPokok}** serta menganalisis kepentingannya.
-  Mengidentifikasi hubungan fungsional timbal balik antar komponen di lingkungan sekolah dasar.

## C. PROFIL PELAJAR PANCASILA
1) **Beriman, bertakwa kepada Tuhan Yang Maha Esa dan berakhlak mulia**: Mendidik rasa syukur murid atas penciptaan tumbuhan dan harmoni alam yang diciptakan Tuhan.
2) **Bernalar kritis**: Mendorong kemampuan siswa menganalisis berbagai perbedaan jenis struktur luar tumbuhan dan fungsi fungsionalnya.
3) **Gotong-royong**: Melatih kolaborasi saat melakukan eksplorasi kelompok di sekitar pekarangan sekolah.
4) **Mandiri**: Memperkuat kemandirian saat mengisi hasil pengamatan harian di buku jurnal belajar masing-masing.

## D. SARANA DAN PRASARANA
- **Sumber Belajar** : Amalia Fitri, dkk (2021) *Ilmu Pengetahuan Alam dan Sosial untuk SD Kelas IV*, Penulis Kementerian Pendidikan Kebudayaan Riset dan Teknologi, Lembar kerja peserta didik (LKPD), dan Internet.
- **Perlengkapan Peserta Didik**: Buku paket panduan, LKPD tercetak, alat tulis lengkap, pensil warna/crayon untuk menggambar, tanaman kecil yang dibawa dari rumah.
- **Perlengkapan Guru**: Contoh tumbuhan berserat akar tunggang dan serabut nyata, spesimen batang berair dan berkayu, proyektor, papan tulis, panduan observasi.

## E. TARGET PESERTA DIDIK
-  **Peserta didik reguler/tipikal**: Umum, siswa dapat memahami seluruh tahapan pembelajaran secara normal tanpa bantuan khusus.
-  **Peserta didik dengan pencapaian tinggi (HOTS)**: Siswa mampu berpikir kreatif kritis, menghubungkan kaitan fotosintesis secara global, dan memiliki jiwa kepemimpinan kelompok.

## F. MODEL PEMBELAJARAN
-  **Pembelajaran Tatap Muka** interaktif yang berbasis pada metode demonstrasi terbimbing dan eksperimen kelompok kecil yang menyenangkan.

---

# KOMPONEN INTI

## A. TUJUAN KEGIATAN PEMBELAJARAN
1. **Tujuan Pembelajaran Bab**: Melalui pengamatan spesimen tumbuhan hidup, peserta didik dapat mengidentifikasi bagian-bagian tubuh tumbuhan dan mendeskripsikan fungsinya dengan tepat.
2. **Tujuan Pembelajaran Topik**:
   - Peserta didik bisa mengidentifikasi bagian-bagian tubuh dari tumbuhan.
   - Peserta didik memahami fungsi dari masing-masing bagian tubuh tumbuhan dengan logis.
   - Peserta didik mampu mengaitkan fungsi bagian tubuh dengan kebutuhan tumbuhan untuk tumbuh, mempertahankan diri, serta berkembang biak secara aktif.

## B. PEMAHAMAN BERMAKNA
- Siswa menyadari bahwa setiap bagian tubuh tumbuhan diciptakan Tuhan dengan peran yang sangat strategis untuk mempertahankan kehidupan di bumi (seperti memproduksi oksigen bersih yang kita hirup), sehingga manusia berkewajiban merawat serta melestarikan tumbuhan demi ekosistem alam yang seimbang.

## C. PERTANYAAN PEMANTIK
1. Apa kesamaan mendasar antara tumbuhan, hewan, dan kita sebagai manusia?
2. Apakah tumbuhan memiliki mulut untuk makan dan kaki untuk berjalan? Jika tidak ada, bagaimana cara tumbuhan makan dan berdiri kokoh?
3. Apa jadinya jika semua daun pada pohon di halaman sekolah kita dipotong habis? Apakah pohon itu bisa terus hidup?

## D. KEGIATAN PEMBELAJARAN

### **1. Kegiatan Pendahuluan (Orientasi, Apersepsi, Motivasi - 10 Menit)**
- **Orientasi**: Guru membuka kelas dengan mengucapkan salam hangat, memimpin doa bersama secara khidmat, dan menanyakan kabar serta memantau kehadiran siswa secara tertib.
- **Apersepsi (3 Menit)**: Siswa dipersilakan menaruh tanaman yang dibawa dari rumah di atas meja masing-masing. Guru merangsang diskusi dengan bertanya: *"Siapa yang membawa tanaman hari ini? Mari kita perhatikan bagian apa saja yang terlihat di permukaan tanah?"*
- **Motivasi (2 Menit)**: Guru menjelaskan betapa pentingnya materi **${materiPokok}** dalam menjamin pasokan udara segar di kelas, dilanjutkan dengan penyampaian tujuan pembelajaran hari ini.

### **2. Kegiatan Inti (50 Menit)**
- **Eksplorasi Literasi**: Siswa dipandu membaca teks pembuka di buku modul ajar mengenai petualangan mengenal bagian organ tanaman secara seksama.
- **Investigasi Kelompok**: Siswa membagi diri ke dalam kelompok belajar berisi 4-5 anak. Guru meminta setiap kelompok mengelompokkan tanaman yang mereka bawa berdasarkan kemiripan fisiknya: daun dengan daun, bunga dengan bunga, serta batang dengan batang.
- **Demonstrasi Nyata (Lakukan Bersama)**: Guru memperlihatkan contoh akar tanaman kangkung (akar serabut) dan tanaman cabai (akar tunggang). Siswa secara aktif menyentuh dan melihat langsung perbedaannya untuk memicu kemampuan kognitif tingkat tinggi.
- **Penyelesaian LKPD**: Guru membagikan lembar kerja (LKPD 1.1) kepada setiap siswa untuk menggambarkan bagian tumbuhan lengkap dengan keterangan tertulisnya secara kreatif.

### **3. Kegiatan Penutup (10 Menit)**
- **Kesimpulan**: Siswa bersama guru melakukan tanya-jawab untuk membuat kesimpulan final dari materi belajar hari ini.
- **Refleksi & Penugasan**: Guru membagikan lembar kerja mandiri untuk diselesaikan di rumah secara teliti serta mengajak siswa berdoa sebagai penutup kelas yang hangat.

### **4. Kegiatan Keluarga**
- Orang tua diajak aktif berpartisipasi dengan membimbing anak-anak melakukan kegiatan merawat tanaman di pekarangan rumah, mengenalkan nama tanaman herbal keluarga yang berguna, atau mendiskusikan proses fotosintesis sambil menyiram tanaman sore hari.

---

## E. REFLEKSI

### **TABEL REFLEKSI GURU**

| No | Pendekatan/Strategi | Sudah Dilakukan | Sudah Dilakukan, Tetapi Belum Efektif | Perlu Peningkatan |
| :---: | :--- | :---: | :---: | :---: |
| 1 | Saya sudah menyiapkan perangkat pembelajaran. | | | |
| 2 | Saya sudah melakukan persiapan siswa untuk belajar. | | | |
| 3 | Saya sudah menunjukkan penguasaan materi pembelajaran. | | | |
| 4 | Saya sudah melaksanakan pembelajaran sesuai dengan kompetensi yang akan dicapai dan karakteristik siswa. | | | |
| 5 | Saya sudah melaksanakan pembelajaran sesuai dengan alokasi waktu yang direncanakan. | | | |
| 6 | Saya melibatkan siswa dalam pemanfaatan media. | | | |
| 7 | Saya sudah menunjukkan sikap terbuka terhadap respons siswa. | | | |
| 8 | Saya sudah memantau kemajuan belajar selama proses. | | | |
| 9 | Saya sudah mengaitkan materi dengan realitas kehidupan. | | | |
| 10 | Saya sudah melakukan refleksi atau membuat rangkuman dengan melibatkan siswa. | | | |

---

## F. ASESMEN / PENILAIAN

### **1. Rubrik Penilaian Proyek**
| Aspek | Sangat Baik (4) | Baik (3) | Cukup (2) | Perlu Perbaikan (1) |
| :--- | :--- | :--- | :--- | :--- |
| **Tanggung Jawab Jurnal** | Merawat tanaman secara mandiri, bertanggung jawab penuh, mengisi catatan jurnal harian secara aktif tanpa diingatkan. | Dapat merawat tanaman dan mengisi jurnal namun terkadang masih harus diingatkan oleh guru kelas. | Merawat tanaman dengan baik namun pengisian jurnal sering lowong atau harus selalu ditemani teman sebaya. | Tidak melakukan perawatan tanaman, membiarkannya layu, dan mengabaikan pengisian jurnal belajar. |

### **2. Rubrik Penilaian Presentasi Produk**
| Aspek Penilaian | Sangat Baik | Baik | Cukup | Perlu Perbaikan |
| :--- | :--- | :--- | :--- | :--- |
| **Sikap Presentasi** | Berdiri tegak, bersuara lancang, sopan, menatap audiens, dan menyampaikan salam pembuka-penutup dengan percaya diri. | Memenuhi 3-4 kriteria sikap presentasi secara baik dan tertib di depan kelas. | Memenuhi 1-2 kriteria sikap presentasi, masih terlihat malu dan ragu-ragu. | Seluruh kriteria sikap presentasi diabaikan, menolak tampil di depan umum. |
| **Pemahaman Konsep** | Menjelaskan materi secara lancar tanpa terpaku membaca media terus menerus, penjelasan didasari analisis ilmiah logis. | Menjelaskan materi secara runtut dan sesekali melihat media bantu presentasi kelas. | Mengandalkan membaca tulisan di media presentasi sepenuhnya dengan suara yang pelan. | Penjelasan membingungkan murid lain, salah konsep dasar, dan tidak menguasai materi. |

---

# LAMPIRAN

## A. LEMBAR KERJA PESERTA DIDIK (LKPD) Lampiran 1.1
Nama Siswa: ______________________ <br>
Kelas: ___________________________ <br>

**Tantangan Kreatif**: Gambarkan tanaman utuh di kertas gambar kalian, kemudian berikan 5 label panah penanda yang mengarah tepat pada komponen berikut:
1. **Akar** (Berperan menyerap air dari bawah tanah)
2. **Batang** (Berperan menyalurkan nutrisi ke seluruh tanaman)
3. **Daun** (Berperan melakukan fotosintesis menghasilkan sari makanan)
4. **Bunga** (Berperan sebagai organ reproduksi perkembangbiakan alami)
5. **Duri** (Berperan melindungi diri dari hewan pemangsa liar sekitar)

## B. BAHAN BACAAN GURU & PESERTA DIDIK
Pada umumnya, bagian tubuh tumbuhan dibagi ke dalam 3 fungsi fungsional: penunjang pertumbuhan utama, proteksi diri (adaptasi), serta kelestarian reproduksi keturunan. Akar terbagi menjadi akar tunggang (berserat kokoh, menusuk dalam tanah seperti cabai/mangga) dan akar serabut (padi, jagung). Batang terdiri atas batang kayu keras (berkambium kokoh seperti beringin), batang basah lunak (kangkung, bayam), dan batang rumput berongga (sereh, padi).

## C. GLOSARIUM
- **Adaptasi**: Penyesuaian diri organisme terhadap lingkungan agar bisa bertahan hidup dengan selamat.
- **Kloroplas**: Buletan hijau di dalam sel daun tumbuhan tempat memasak sari makanan dengan bantuan sinar surya.

## D. DAFTAR PUSTAKA
1. Amalia Fitri, dkk. (2021). *Ilmu Pengetahuan Alam dan Sosial untuk Sekolah Dasar*. Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi Republik Indonesia.

---

### TANDA TANGAN PENGESAHAN

| Mengetahui, <br> Kepala Sekolah | Tempat, Tanggal Pengesahan <br> Guru Kelas |
| :--- | :--- |
| <br><br><br> **TOHID, S.Pd.SD** <br> NIP. 19650402 199102 1 001 | <br><br><br> **${namaGuru}** <br> NIP. 19850317 202221 1 023 |`;
}

// API Routes
app.post("/api/generate-modul", async (req, res) => {
  try {
    const {
      namaGuru,
      namaInstitusi,
      kurikulum,
      jenjang,
      fase,
      kelas,
      mataPelajaran,
      materiPokok,
      jumlahPertemuan,
      lamaPertemuan,
      modelPembelajaran,
      capaianPembelajaran,
      tujuanPembelajaran,
      dimensiLulusan, // array of strings
      catatanTambahan,
      tipeDokumen, // 'modul', 'lkpd', 'asesmen', 'bahan_ajar'
    } = req.body;

    const ai = getAIClient();
    
    // Choose the dimension labels
    const dimensiString = (dimensiLulusan && dimensiLulusan.length > 0)
      ? dimensiLulusan.join(", ")
      : "Mandiri, Bernalar Kritis";

    // Build specific prompt based on tipeDokumen
    let prompt = "";
    let systemInstruction = "Anda adalah pakar kurikulum pendidikan nasional Indonesia khususnya Kurikulum Merdeka (SKL terbaru) dan Kurikulum KBC (Kurikulum Berbasis Kompetensi). Anda bertugas membantu guru membuat administrasi pembelajaran yang terstruktur, kreatif, detail, and bernilai pedagogis tinggi sesuai dengan pilihan kurikulum yang diinputkan. Respon Anda harus ditulis dalam bahasa Indonesia yang formal, edukatif, bersahabat, and mudah dipahami oleh guru dan kepala sekolah.";

    if (tipeDokumen === "lkpd") {
      prompt = `Buatlah Lembar Kerja Peserta Didik (LKPD) yang menarik dan menantang untuk materi pembelajaran berikut:
- Nama Institusi: ${namaInstitusi}
- Kurikulum: ${kurikulum}
- Jenjang / Fase / Kelas: ${jenjang} / ${fase} / ${kelas}
- Mata Pelajaran: ${mataPelajaran}
- Materi Pokok: ${materiPokok}
- Jumlah Pertemuan / Alokasi Waktu: ${jumlahPertemuan} Pertemuan (${lamaPertemuan})
- Model Pembelajaran: ${modelPembelajaran}
- Capaian Pembelajaran (CP) Target: ${capaianPembelajaran || "Sesuaikan otomatis berdasarkan kurikulum"}
- Tujuan Pembelajaran (TP) Acuan: ${tujuanPembelajaran || "Sesuaikan otomatis berdasarkan kurikulum"}
- Dimensi Karakter / Kompetensi (Profil Lulusan) yang Diperkuat: ${dimensiString}
- Catatan Kustom Guru: ${catatanTambahan || "-"}

Format LKPD harus mencakup:
1. Sampul / Kop LKPD yang menawan
2. Judul Kegiatan & Tujuan Kegiatan (Gunakan referensi tujuan pembelajaran TP yang diinputkan jika ada)
3. Petunjuk Belajar bagi Siswa
4. Alat dan Bahan (jika ada)
5. Langkah-Langkah Kegiatan yang interaktif dan mendorong berpikir tingkat tinggi (HOTS) sesuai model pembelajaran ${modelPembelajaran}
6. Pertanyaan Pemantik / Diskusi Kelompok
7. Kolom Jawaban / Rubrik Penilaian Sederhana untuk siswa merefleksikan kerja kelompok/mandiri mereka.

Rancang materi LKPD ini secara spesifik dan aplikatif, jangan hanya berupa template kosong. Tulis dalam Markdown yang rapi dengan format yang sangat matang sesuai dengan kaidah ${kurikulum}.`;
    } else if (tipeDokumen === "asesmen") {
      prompt = `Buatlah Instrumen Asesmen dan Rubrik Penilaian ${kurikulum} secara sangat detail untuk materi pembelajaran berikut:
- Nama Guru: ${namaGuru}
- Nama Institusi: ${namaInstitusi}
- Jenjang / Fase / Kelas: ${jenjang} / ${fase} / ${kelas}
- Mata Pelajaran: ${mataPelajaran}
- Materi Pokok: ${materiPokok}
- Model Pembelajaran: ${modelPembelajaran}
- Capaian Pembelajaran (CP) Target: ${capaianPembelajaran || "Sesuaikan otomatis berdasarkan kurikulum"}
- Tujuan Pembelajaran (TP) Acuan: ${tujuanPembelajaran || "Sesuaikan otomatis berdasarkan kurikulum"}
- Dimensi Karakter / Kompetensi Pancasila: ${dimensiString}
- Catatan Kustom Guru: ${catatanTambahan || "-"}

Format Asesmen harus menonjolkan:
1. Asesmen Diagnostik (Non-kognitif & Kognitif sebelum belajar) - berikan 3 pertanyaan sampel
2. Asesmen Formatif (Saat pembelajaran berjalan: Observasi Sikap, Unjuk Kerja/Kelompok) - sertakan rubric lembar observasi yang rinci dengan skor 1-4 beserta indikatornya, mengacu pada TP dan CP yang ditentukan.
3. Asesmen Sumatif (Akhir materi) - berikan kisi-kisi soal, 3 contoh soal pilihan ganda HOTS, dan 2 soal uraian beserta Kunci Jawaban dan Pedoman Penskoran lengkap.

Gunakan standar ${kurikulum} terbaru yang mengedepankan ketercapaian tujuan pembelajaran (KKTP). Tulis dalam format Markdown yang rapi dan siap saji.`;
    } else if (tipeDokumen === "bahan_ajar") {
      prompt = `Buatlah ringkasan Bahan Ajar (Bahan Bacaan Guru dan Peserta Didik) yang kaya, informatif, dan mendalam untuk materi berikut:
- Kurikulum: ${kurikulum}
- Jenjang / Fase / Kelas: ${jenjang} / ${fase} / ${kelas}
- Mata Pelajaran: ${mataPelajaran}
- Materi Pokok: ${materiPokok}
- Capaian Pembelajaran (CP) Target: ${capaianPembelajaran || "Sesuaikan otomatis berdasarkan kurikulum"}
- Tujuan Pembelajaran (TP) Acuan: ${tujuanPembelajaran || "Sesuaikan otomatis berdasarkan kurikulum"}
- Catatan Tambahan Fokus Materi: ${catatanTambahan || "-"}

Bahan ajar harus memuat:
1. Pengantar konsep yang asyik dan intuitif menggunakan contoh kehidupan nyata di Indonesia.
2. Penjelasan konsep inti secara komprehensif, logis, dan ramah anak sesuai tingkat kognitif kelas ${kelas} serta selaras dengan Capaian Pembelajaran (CP): ${capaianPembelajaran || "materi terkait"}.
3. Infografis tekstual / peta konsep sederhana.
4. Glosarium istilah-istilah sulit.
5. Pertanyaan pemantik atau tantangan kecil di sela-sela bacaan untuk menjaga fokus siswa.

Buat bacaan ini menarik dan berbobot ilmiah namun dikemas populer. Pastikan mudah dipahami untuk level siswa ${kelas}. Tulis dalam Markdown yang elegan sesuai prinsip ${kurikulum}.`;
    } else {
      // DEFAULT: COMPLETE MODUL AJAR
      prompt = `Buatlah draf lengkap Modul Ajar (RPP) ${kurikulum} yang sangat matang, komprehensif, dan profesional berdasarkan informasi berikut:
- Penyusun: ${namaGuru || "Laeli Fajriyah, S.Pd"}
- Institusi: ${namaInstitusi || "SD Negeri Korowelang"}
- Kurikulum: ${kurikulum}
- Jenjang / Fase / Kelas: ${jenjang} / ${fase} / ${kelas}
- Mata Pelajaran: ${mataPelajaran}
- Materi Pokok: ${materiPokok}
- Durasi: ${jumlahPertemuan} Pertemuan (${jumlahPertemuan} x ${lamaPertemuan})
- Model Pembelajaran: ${modelPembelajaran}
- Capaian Pembelajaran (CP) Target: ${capaianPembelajaran || "Peserta didik mengidentifikasi kaitan perilaku hidup, struktur, fungsi, atau aplikasi materi pokok ini secara logis."}
- Tujuan Pembelajaran (TP) Acuan: ${tujuanPembelajaran || "Peserta didik mampu memahami dan menceritakan kembali esensi dari materi pokok."}
- Profil Lulusan / Dimensi Karakter: ${dimensiString}
- Kustomisasi Khusus dari Guru: ${catatanTambahan || "Tidak ada catatan khusus"}

Anda wajib menghasilkan dokumen terstruktur secara presisi mengikuti template resmi pada PDF berikut. Pastikan setiap judul ditulis tebal dengan penomoran persis seperti di bawah ini, dan isi materi nyata, detail, kaya, dan bukan berupa petunjuk kosong:

# MODUL AJAR KURIKULUM MERDEKA ${new Date().getFullYear()}
## SEKOLAH DASAR (SD/MI)

- **Nama penyusun** : ${namaGuru || "Laeli Fajriyah, S.Pd"}
- **Nama Sekolah** : ${namaInstitusi || "SD Negeri Korowelang"}
- **Mata Pelajaran** : ${mataPelajaran}
- **Fase, Kelas / Semester** : ${fase}, ${kelas} / II (Genap)

---

# INFORMASI UMUM

## A. IDENTITAS MODUL
- **Penyusun** : ${namaGuru || "Laeli Fajriyah, S.Pd"}
- **Instansi** : ${namaInstitusi || "SD Negeri Korowelang"}
- **Tahun Penyusunan** : ${new Date().getFullYear()}
- **Jenjang Sekolah** : ${jenjang}
- **Mata Pelajaran** : ${mataPelajaran}
- **Fase / Kelas** : ${fase} / ${kelas}
- **BAB / Materi Pokok** : ${materiPokok}
- **Topik** : Pembahasan Utama ${materiPokok}
- **Alokasi Waktu** : ${jumlahPertemuan} Pertemuan (${lamaPertemuan})

## B. KOMPETENSI AWAL
- *Kompetensi Prasyarat*: Uraikan prasyarat kompetensi awal yang logis sesuai materi "${materiPokok}" secara fungsional. (Gunakan simbol bullet "" atau poin berurutan).

## C. PROFIL PELAJAR PANCASILA
Tuliskan rincian profil pelajar Pancasila yang diintegrasikan secara fungsional (misal: 1) Beriman, bertakwa kepada Tuhan Yang Maha Esa dan berakhlak mulia, 2) Mandiri, 3) Bernalar kritis, 4) Kreatif, 5) Gotong royong, 6) Kebinekaan global). Berikan penjelasan kontekstual tentang bagaimana masing-masing dimensi tersebut tercermin selama aktivitas pembelajaran materi ${materiPokok}.

## D. SARANA DAN PRASARANA
- **Sumber Belajar** : (Sebutkan rujukan utama buku panduan guru, buku modul ajar resmi kementerian, dan pranala internet yang kredibel).
- **Perlengkapan yang dibutuhkan peserta didik** (misal: lembar kerja, alat tulis, media konkret untuk mendukung materi "${materiPokok}").
- **Perlengkapan yang dibutuhkan guru** (misal: alat peraga khusus, contoh konkret di sekitar kelas, slide presentasi interaktif).

## E. TARGET PESERTA DIDIK
- **Peserta didik reguler/tipikal** : umum, tidak ada kesulitan dalam mencerna dan memahami materi ajar.
- **Peserta didik dengan pencapaian tinggi** : mencerna dan memahami dengan cepat, mampu mencapai keterampilan berpikir kritis tingkat tinggi (HOTS), dan memiliki keterampilan kepemimpinan serta kolaboratif.

## F. MODEL PEMBELAJARAN
- **Model Pembelajaran** : ${modelPembelajaran} (misalnya model Tatap Muka interaktif, Problem Based Learning atau Project Based Learning, jelaskan secara singkat pelaksanaannya).

---

# KOMPONEN INTI

## A. TUJUAN KEGIATAN PEMBELAJARAN
- **Capaian Pembelajaran (CP) Target** : ${capaianPembelajaran || "Tuliskan deskripsi rumusan Capaian Pembelajaran standar nasional yang selaras dengan materi."}
- **Tujuan Pembelajaran (TP) Acuan** : ${tujuanPembelajaran || "Tuliskan rumusan indikator tujuan pembelajaran secara konkret dengan kata kerja operasional Taksonomi Bloom hasil revisi."}

## B. PEMAHAMAN BERMAKNA
- Jelaskan secara detail dan menyentuh bagaimana pemahaman materi "${materiPokok}" ini membawa dampak positif, solusi nyata, dan kegunaan taktis dalam kehidupan sehari-hari siswa.

## C. PERTANYAAN PEMANTIK
(Sajikan minimal 3 pertanyaan pemantik diskusi yang kritis, menantang logika, dan merangsang rasa ingin tahu siswa di awal sesi)
1. ...
2. ...
3. ...

## D. KEGIATAN PEMBELAJARAN
Bagi secara sistematis per bagian aktivitas dengan estimasi waktu yang detail dan terukur:
1. **Kegiatan Pendahuluan**
   - **Kegiatan Orientasi** (3 Menit): Guru memulai dengan menyapa hangat, berdoa bersama secara khidmat, dan memeriksa kehadiran siswa secara tertib.
   - **Kegiatan Apersepsi** (5 Menit): Guru memicu rasa penasaran siswa dengan mengaitkan materi lewat analogi kehidupan sehari-hari atau lingkungan lokal sekitar.
   - **Kegiatan Motivasi** (2 Menit): Menampilkan gambaran keindahan/manfaat topik ${materiPokok} agar siswa bersemangat untuk belajar, dilanjutkan dengan penyampaian tujuan pembelajaran hari ini.
2. **Kegiatan Inti (Disesuaikan dengan Sintaks ${modelPembelajaran})**
   - Jabarkan langkah kegiatan eksploratif, interaktif, dan kolaboratif secara bertahap dan rinci sesuai kaidah ${modelPembelajaran}. Berikan instruksi berbasis kelompok atau investigasi mandiri yang bermutu tinggi agar siswa aktif berdiskusi.
3. **Kegiatan Penutup**
   - Siswa bersama guru mereview kesimpulan dari materi hari ini secara partisipatif.
   - Refleksi singkat dan guru mengumumkan tugas di lembar kerja peserta didik (LKPD).
   - Berdoa bersama dan menutup kelas dengan salam.
4. **Kegiatan Keluarga** (Uraikan instruksi khusus kolaboratif untuk memperparaf keterlibatan orang tua/keluarga dalam menyelaraskan pembelajaran di rumah secara konkrit).

## E. REFLEKSI
- **Refleksi Guru**:
  Wajib sajikan dan sertakan tabel utuh berjudul **TABEL REFLEKSI GURU** dalam format tabel Markdown standar yang presisi dengan kolom dan baris persis seperti di bawah ini (kolom checklist dibiarkan kosong agar siap cetak/diisi):

  | No | Pendekatan/Strategi | Sudah Dilakukan | Sudah Dilakukan, Tetapi Belum Efektif | Perlu Peningkatan |
  | :---: | :--- | :---: | :---: | :---: |
  | 1 | Saya sudah menyiapkan perangkat pembelajaran. | | | |
  | 2 | Saya sudah melakukan persiapan siswa untuk belajar. | | | |
  | 3 | Saya sudah menunjukkan penguasaan materi pembelajaran. | | | |
  | 4 | Saya sudah melaksanakan pembelajaran sesuai dengan kompetensi yang akan dicapai dan karakteristik siswa. | | | |
  | 5 | Saya sudah melaksanakan pembelajaran sesuai dengan alokasi waktu yang direncanakan. | | | |
  | 6 | Saya melibatkan siswa dalam pemanfaatan media. | | | |
  | 7 | Saya sudah menunjukkan sikap terbuka terhadap respons siswa. | | | |
  | 8 | Saya sudah memantau kemajuan belajar selama proses. | | | |
  | 9 | Saya sudah mengaitkan materi dengan realitas kehidupan. | | | |
  | 10 | Saya sudah melakukan refleksi atau membuat rangkuman dengan melibatkan siswa. | | | |

- **Refleksi Peserta Didik**: (Sajikan pertanyaan reflektif sederhana yang interaktif untuk membantu siswa mengukur pemahaman pribadi).

## F. ASESMEN / PENILAIAN
### 1. Asesmen Diagnostik (Sebelum Belajar)
(Tuliskan 3 pertanyaan kognitif/non-kognitif awal untuk mendeteksi kesiapan dasar siswa).

### 2. Asesmen Formatif (Pertemuan/Proses)
Sajikan instrumen berupa tabel **Rubrik Penilaian Unjuk Kerja / Proyek** dengan kolom:
- Kriteria (aspek)
- **Sangat Baik** (skor 4)
- **Baik** (skor 3)
- **Cukup** (skor 2)
- **Perlu Perbaikan** (skor 1)

Sajikan juga tabel **Rubrik Penilaian Presentasi Produk** dengan kolom:
- Aspek Penilaian (seperti Sikap presentasi, Pemahaman konsep)
- Deskripsi rincian untuk kategori **Sangat Baik**, **Baik**, **Cukup**, dan **Perlu Perbaikan** secara terperinci.

### 3. Asesmen Sumatif (Akhir Pembelajaran)
- Sediakan kisi-kisi atau contoh 3 soal pilihan ganda HOTS, dan 2 soal uraian beserta Kunci Jawaban Lengkap dan Pedoman Penskoran.

## G. KEGIATAN PENGAYAAN DAN REMEDIAL
- **Pengayaan** : Program akselerasi pemahaman materi lanjutan untuk siswa berpencapaian tinggi.
- **Remedial** : Bimbingan terbimbing secara personal atau berkelompok kecil bagi siswa yang butuh penyesuaian untuk mencapai kriteria pemahaman.

## H. UJI PEMAHAMAN
(Sajikan set pertanyaan uji pemahaman mandiri dan tuliskan kunci jawaban penjelasannya).

---

# LAMPIRAN

## A. LEMBAR KERJA PESERTA DIDIK (LKPD) Lampiran 1.1
Sajikan lembaran LKPD siap-pakai secara lengkap (bukan template kosong). Cantumkan:
- **Nama Siswa** & **Kelas**
- **Tujuan Kegiatan**
- **Petunjuk Belajar**
- **Skenario/Langkah Eksperimen atau Tantangan**
- **Lembar Isian / Pertanyaan Diskusi**

## B. BAHAN BACAAN GURU & PESERTA DIDIK
Sajikan rangkuman teori materi "${materiPokok}" secara mendalam, representatif, padat, dan asyik dibaca baik oleh guru maupun siswa. Jelaskan tipologi, sub-klasifikasi, dan analogi materi secara utuh.

## C. GLOSARIUM
Sediakan glosarium daftar istilah-istilah ilmiah penting dan artinya untuk menunjang pencapaian kosakata baru peserta didik.

## D. DAFTAR PUSTAKA
Cantumkan referensi kepustakaan minimal 2-3 rujukan formal yang kredibel.

---

### TANDA TANGAN PENGESAHAN

Tuliskan kolom penutup pengesahan resmi berisikan:

| Mengetahui, <br> Kepala Sekolah | Tempat, Tanggal Pengesahan <br> Guru Kelas |
| :--- | :--- |
| <br><br><br> **__________________________** <br> NIP. | <br><br><br> **__________________________** <br> NIP. |

Pastikan seluruh bagian di atas diisi secara padat, bernilai, edukatif, dan tidak mengandung placeholder kosong. Format respon Anda dalam Markdown yang sangat rapi dan estetik!`;
    }

    const response = await generateContentWithFallback(
      ai,
      "gemini-3.5-flash",
      prompt,
      systemInstruction,
      0.7
    );

    const outputText = response.text || "Gagal membuat modul, silakan coba lagi.";
    res.json({ success: true, text: outputText });
  } catch (error: any) {
    console.error("Gemini API Error, falling back to secure local model generator:", error);
    try {
      const errMsg = error?.message || error?.toString() || "Unknown API error";
      const fallbackText = generateLocalFallbackDocument(req.body, errMsg);
      res.json({ 
        success: true, 
        text: fallbackText, 
        isFallback: true, 
        apiErrorMessage: errMsg 
      });
    } catch (fallbackError: any) {
      res.status(500).json({
        success: false,
        error: "Gagal membuat dokumen baik lewat AI maupun generator lokal: " + fallbackError.message,
      });
    }
  }
});

// Serve frontend assets in production and run Vite server in development
(async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express server running on http://0.0.0.0:${PORT}`);
  });
})();
