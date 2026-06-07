export interface AcademicMapping {
  fase: string[];
  kelas: string[];
}

export type DocumentType = "modul" | "lkpd" | "asesmen" | "bahan_ajar";

export interface Dimensions {
  id: string;
  nama: string;
  deskripsi: string;
}

export interface GeneratorParams {
  namaGuru: string;
  namaInstitusi: string;
  kurikulum: string;
  jenjang: "PAUD/TK" | "SD/MI" | "SMP/MTs" | "SMA/MA/SMK";
  fase: string;
  kelas: string;
  mataPelajaran: string;
  materiPokok: string;
  jumlahPertemuan: number;
  lamaPertemuan: string;
  modelPembelajaran: string;
  capaianPembelajaran: string;
  tujuanPembelajaran: string;
  dimensiLulusan: string[];
  catatanTambahan: string;
  tipeDokumen: DocumentType;
}

export interface GeneratedHistoryItem {
  id: string;
  timestamp: string;
  params: GeneratorParams;
  outputText: string;
}
