// ============================================
// app.js — JS bersama: navigasi, viewer marker, wake lock,
// dan cleanup kamera AR.
// Logika tracking AR ada di js/ar.js (halaman ar.html).
// ============================================

const SCAN_DIR = 'assets/SCAN/';

// ============================================
// CLEANUP KAMERA AR
// Saat user meninggalkan ar.html: hentikan render loop dan
// matikan track stream webcam agar navigasi balik tidak bentrok.
// ============================================
let arCameraStopped = false;

const stopArCamera = () => {
  const scene = document.querySelector('a-scene');
  if (!scene || arCameraStopped) return;
  arCameraStopped = true;

  try {
    if (typeof scene.pause === 'function') scene.pause();
  } catch (err) {
    console.warn('Gagal menjeda scene AR:', err);
  }

  document.querySelectorAll('video').forEach((video) => {
    const stream = video.srcObject;
    if (stream && typeof stream.getTracks === 'function') {
      stream.getTracks().forEach((track) => {
        try { track.stop(); } catch (err) { /* abaikan */ }
      });
    }
    try { video.pause(); } catch (err) { /* abaikan */ }
    video.srcObject = null;
  });
};

// ============================================
// DATA MARKER
// Daftar ini menjadi urutan & label default. Bila server
// menampilkan isi folder assets/SCAN/, daftar file dibaca
// ulang dari sana (file baru otomatis muncul).
// ============================================
const MARKERS = [
  { file: 'pattern-BENITO.png', name: 'Benito Mussolini', meta: 'Italia · 1922–1943' },
  { file: 'pattern-HITLER.png', name: 'Adolf Hitler', meta: 'Jerman · 1933–1945' },
  { file: 'pattern-ILSUNG.png', name: 'Kim Il-sung', meta: 'Korea Utara · 1948–1994' },
  { file: 'pattern-MAO.png', name: 'Mao Zedong', meta: 'Tiongkok · 1949–1976' },
  { file: 'pattern-POLPOT.png', name: 'Pol Pot', meta: 'Kamboja · 1975–1979' },
  { file: 'pattern-STALIN.png', name: 'Joseph Stalin', meta: 'Uni Soviet · 1924–1953' }
];

const IMAGE_EXTENSIONS = /\.(png|jpe?g|webp|avif)$/i;

const markerSrc = (file) => `${SCAN_DIR}${file}`;

const markerByFile = new Map(MARKERS.map((marker) => [marker.file, marker]));

const labelFromFile = (file) => {
  const base = file
    .replace(/\.[^.]+$/, '')
    .replace(/^pattern[-_]/i, '')
    .replace(/[-_]+/g, ' ')
    .trim();

  return base
    ? base.toLowerCase().replace(/\b\p{L}/gu, (char) => char.toUpperCase())
    : base;
};

const toMarkerEntry = (file) => {
  const known = markerByFile.get(file);
  if (known) return known;
  return { file, name: labelFromFile(file), meta: 'Penanda AR' };
};

// Baca isi folder bila server mengizinkan directory listing.
const fetchScanFiles = async () => {
  try {
    const response = await fetch(SCAN_DIR, { headers: { Accept: 'text/html' } });
    if (!response.ok) return null;

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const files = [...doc.querySelectorAll('a[href]')]
      .map((anchor) => anchor.getAttribute('href') || '')
      .map((href) => href.split('/').pop().split('?')[0])
      .filter(Boolean)
      .filter((file) => IMAGE_EXTENSIONS.test(file));

    return [...new Set(files)].length ? [...new Set(files)] : null;
  } catch (err) {
    return null;
  }
};

const resolveMarkerList = async () => {
  const files = await fetchScanFiles();
  if (!files) return MARKERS;

  const listed = files.map(toMarkerEntry);
  const extra = MARKERS.filter((marker) => !files.includes(marker.file));

  return [...listed, ...extra];
};

const createMarkerCard = ({ file, name, meta }) => {
  const src = markerSrc(file);

  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'marker-card';
  card.dataset.src = src;
  card.dataset.label = name;
  card.setAttribute('aria-label', `Buka penanda ${name}`);

  const thumb = document.createElement('span');
  thumb.className = 'marker-card__thumb';

  const img = document.createElement('img');
  img.src = src;
  img.alt = `Penanda AR ${name}`;
  img.loading = 'lazy';
  img.decoding = 'async';

  thumb.appendChild(img);

  const caption = document.createElement('span');
  caption.className = 'marker-card__caption';

  const nameEl = document.createElement('span');
  nameEl.className = 'marker-card__name';
  nameEl.textContent = name;

  const metaEl = document.createElement('span');
  metaEl.className = 'marker-card__meta';
  metaEl.textContent = meta;

  caption.append(nameEl, metaEl);
  card.append(thumb, caption);
  return card;
};

const renderMarkerGrid = (grid, markers) => {
  if (!markers.length) {
    const empty = document.createElement('p');
    empty.className = 'grid-empty';
    empty.textContent = 'Belum ada gambar penanda di folder assets/SCAN/.';
    grid.replaceChildren(empty);
    return;
  }

  const fragment = document.createDocumentFragment();
  markers.forEach((marker) => fragment.appendChild(createMarkerCard(marker)));
  grid.replaceChildren(fragment);
};

// ============================================
// WAKE LOCK
// Dipakai selama viewer marker terbuka.
// Browser tanpa dukungan akan diabaikan tanpa error.
// ============================================
const createWakeLock = () => {
  let sentinel = null;
  let active = false;

  const supported = () => 'wakeLock' in navigator;

  const acquire = async () => {
    if (!supported() || !active) return;
    if (sentinel && !sentinel.released) return;

    try {
      sentinel = await navigator.wakeLock.request('screen');
      sentinel.addEventListener('release', () => {
        sentinel = null;
      });
    } catch (err) {
      sentinel = null;
      console.warn('Screen Wake Lock gagal aktif:', err);
    }
  };

  const release = async () => {
    if (!sentinel) return;
    try {
      await sentinel.release();
    } catch (err) {
      console.warn('Screen Wake Lock gagal dilepas:', err);
    }
    sentinel = null;
  };

  return {
    supported,
    enable: () => {
      active = true;
      return acquire();
    },
    disable: () => {
      active = false;
      return release();
    },
    resume: () => {
      if (active) acquire();
    }
  };
};

// ============================================
// VIEWER MARKER PENUH (marker.html)
// ============================================
const initMarkerViewer = () => {
  const grid = document.getElementById('marker-grid');
  const viewer = document.getElementById('marker-viewer');
  if (!grid || !viewer) return;

  const viewerImg = document.getElementById('viewer-img');
  const viewerTitle = document.getElementById('viewer-title');
  const viewerDownload = document.getElementById('viewer-download');
  const closeBtn = viewer.querySelector('[data-viewer-close]');
  const wakeLock = createWakeLock();

  let lastFocused = null;

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') wakeLock.resume();
  };

  const onPageExit = () => wakeLock.disable();

  const restoreFocus = () => {
    if (lastFocused && typeof lastFocused.focus === 'function') {
      lastFocused.focus({ preventScroll: true });
    }
    lastFocused = null;
  };

  const openViewer = (src, label) => {
    lastFocused = document.activeElement;

    viewerImg.src = src;
    viewerImg.alt = `Penanda AR ${label}`;
    viewerTitle.textContent = label;
    viewerDownload.href = src;
    viewerDownload.setAttribute('download', src.split('/').pop());

    if (!viewer.open) viewer.showModal();
    document.documentElement.classList.add('is-viewer-open');

    wakeLock.enable();
    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('pagehide', onPageExit);

    if (closeBtn) closeBtn.focus({ preventScroll: true });
  };

  const closeViewer = () => {
    wakeLock.disable();
    document.removeEventListener('visibilitychange', onVisibilityChange);
    window.removeEventListener('pagehide', onPageExit);

    document.documentElement.classList.remove('is-viewer-open');
    if (viewer.open) viewer.close();
  };

  // Event delegation: klik kartu penanda
  grid.addEventListener('click', (event) => {
    const card = event.target.closest('.marker-card');
    if (!card || !grid.contains(card) || !card.dataset.src) return;
    openViewer(card.dataset.src, card.dataset.label || 'Penanda');
  });

  // Event delegation: tombol tutup + klik backdrop
  viewer.addEventListener('click', (event) => {
    if (event.target.closest('[data-viewer-close]')) {
      closeViewer();
      return;
    }
    if (event.target === viewer) closeViewer();
  });

  // Esc / penutupan native dialog
  viewer.addEventListener('close', () => {
    document.documentElement.classList.remove('is-viewer-open');
    wakeLock.disable();
    restoreFocus();
  });

  // Jaga-jaga saat halaman ditinggal tanpa menutup viewer
  window.addEventListener('pagehide', () => wakeLock.disable());
  window.addEventListener('beforeunload', () => wakeLock.disable());

  resolveMarkerList()
    .then((markers) => renderMarkerGrid(grid, markers))
    .catch(() => renderMarkerGrid(grid, MARKERS));
};

// ============================================
// HALAMAN AR — pesan bantuan bila kamera tidak tersedia
// (tidak menyentuh logika tracking di js/ar.js)
// ============================================
const initArPage = () => {
  const status = document.getElementById('camera-status');
  if (!status) return;

  const canUseCamera =
    window.isSecureContext &&
    !!navigator.mediaDevices &&
    typeof navigator.mediaDevices.getUserMedia === 'function';

  if (canUseCamera) return;

  const text = document.createElement('p');
  text.textContent =
    'Kamera tidak tersedia di perangkat atau koneksi ini. Halaman AR membutuhkan '
    + 'HTTPS (atau localhost) beserta izin kamera. Galeri penanda tetap bisa dibuka.';

  const link = document.createElement('p');
  const anchor = document.createElement('a');
  anchor.href = 'marker.html';
  anchor.textContent = 'Buka galeri penanda';
  link.appendChild(anchor);

  status.append(text, link);
  status.hidden = false;
};

// ============================================
// BOOT
// ============================================
const init = () => {
  initMarkerViewer();
  initArPage();

  const onLeave = () => stopArCamera();
  window.addEventListener('pagehide', onLeave);
  window.addEventListener('beforeunload', onLeave);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
