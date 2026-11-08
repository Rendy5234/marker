# Laporan Mingguan — Proyek AR Sejarah Tokoh Dunia

## 1. Ringkasan Eksekutif
- Menstabilkan dan memposisikan ulang **Command Center** (tata letak 3 monitor) pada marker AR sehingga monitor samping terbaca dengan jelas.
- Mengimplementasikan **auto-scroll mulus (seamless)** pada konten dua monitor samping.
- Merapikan konfigurasi pelacakan AR.js (`smoothPosition`/`smoothRotation`, `maxDetectionRate: 30`) untuk mengurangi getaran visual.
- Menyelesaikan mekanisme loop tak berujung berbasis *canvas texture* tanpa menggambar ulang tiap frame.
- Memperkaya data tokoh (`tokoh.json`) agar konten monitor dapat diuji scroll.

## 2. Deskripsi Proyek
Proyek menghadirkan visual *hologram* bergaya "Command Center" 3 monitor yang muncul di atas marker AR. Dibangun dengan **A-Frame 1.5.0**, **AR.js (aframe-ar)**, dan **Three.js**. Seluruh tampilan monitor dirender sekali ke `<canvas>` lalu dipetakan sebagai tekstur ke bidang 3D (*canvas-to-texture*), sehingga beban render per-frame minimal.

## 3. Arsitektur Sistem
- `index.html` — scene AR, konfigurasi AR.js & renderer, panel info HTML.
- `js/app.js` — logika utama: pembuatan marker, monitor, kanvas, tekstur, komponen kustom.
- `data/tokoh.json` — data tokoh (nama, idiologi, dampak, pelajaran, timeline, tags).
- `.clinerules/` — aturan & laporan proyek.

**Alur render:** satu fungsi menggambar konten ke canvas → `THREE.CanvasTexture` → material `MeshBasicMaterial` pada bidang `a-plane` → diperbarui hanya saat perlu.

## 4. Capaian Minggu Ini

### a. Stabilisasi & Penempatan Command Center
- Rotasi container difinalkan ke `-90 0 0` (tidur datar di atas marker), posisi `0 0.1 0`.
- Sisi monitor diatur pada X `±0.9`, Y `0`, lebar dunia `0.75`, tinggi dunia `1.0`.
- Rotasi Y monitor kiri `35°`, kanan `-35°` → tata letak mengipas (`/ | \`) sehingga tiap layar menghadap pengamat.

### b. Layout 3 Monitor
- **Tengah:** billboard di titik pusat, canvas 256×340 (dunia 0.9×1.2).
- **Samping:** canvas 340×425 (dunia 0.75×1.0), berisi layer background, chrome, dan konten.

### c. Auto-Scroll Seamless (Monitor Samping)
- Komponen `canvas-scroller` dengan easing **smoothstep** (`t*t*(3-2t)`).
- Loop mulus dicapai dengan menggambar konten **dua kali** secara vertikal (canvas `contentH × 2`) dan `wrapT = RepeatWrapping`.
- `maxOffset` = tepat satu salinan penuh = `contentH / canvasHeight` = `0.5`.
- Arah scroll dikoreksi agar konten **mengalir ke atas** (mulai dari atas) melalui parameter `invert`.
- Durasi: **10 detik** (kiri), **12 detik** (kanan) agar kecepatan baca nyaman.

### d. Data & Konfigurasi
- Entri tokoh `hitler` diperkaya (dampak, pelajaran, timeline, tags) untuk memberi konten scrollable lebih banyak.
- AR.js: `smoothPosition/smoothRotation: true`, `maxDetectionRate: 30`.

## 5. Pengujian & Validasi
- Validasi sintaks JavaScript: `node --check js/app.js` → **lolos (ExitCode 0)**.
- Validasi JSON `tokoh.json` → valid.
- Simulasi arah scroll (skrip Node) mengonfirmasi konten mengalir ke atas dengan `invert: true`.
- Uji browser manual: `http://localhost:8080/`, hard-refresh, lalu scan marker.

## 6. Kendala yang Dihadapi
- **Timing inisialisasi komponen:** memastikan `setup()` dipanggil setelah `setAttribute('canvas-scroller', ...)`.
- **Orientasi tekstur Three.js:** dengan `flipY=true`, menambah `offset.y` membuat konten turun; diselesaikan dengan membalik arah.
- Referensi tekstur lama pasca-*refactor* canvas 2× perlu dijaga agar menunjuk canvas yang telah di-resize.

## 7. Rencana Minggu Berikutnya
1. Verifikasi loop tak berujung tanpa lompatan pada uji browser nyata.
2. Menstabilkan timing inisialisasi komponen (bila perlu pindah panggilan `setup()` ke event `componentinitialized`).
3. Menambah tokoh / konten agar pengujian scroll lebih beragam.
4. Menyempurnakan keterbacaan teks monitor samping.

## 8. Lampiran — Parameter Teknis
| Elemen | Posisi | Rotasi | Dimensi Dunia | Canvas |
|---|---|---|---|---|
| Monitor Kiri | `-0.9 0 0.15` | `0 35 0` | 0.75 × 1.0 | 340 × 425 |
| Monitor Tengah | `0 0 0` | `0 0 0` | 0.9 × 1.2 | 256 × 340 |
| Monitor Kanan | `0.9 0 0.15` | `0 -35 0` | 0.75 × 1.0 | 340 × 425 |
| Container | `0 0.1 0` | `-90 0 0` | — | — |

**Rumus scroll:** `maxOffset = contentH / (contentH × 2) = 0.5`; `offset.y = (invert ? maxOffset - t·maxOffset : t·maxOffset)` dengan `t` setelah easing smoothstep.

