// ============================================
// AR Sejarah Tokoh Dunia - Version 11.0
// "Canvas Texture Hologram - Zero Per-Frame Redraw"
// ============================================

// ============================================
// HELPER: Resolve path aset
// ============================================
function resolveAssetPath(path) {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('/')) return path;
  return new URL(path, window.location.href).href;
}

// ============================================
// HELPER: Hex color → "r,g,b" string
// ============================================
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

// ============================================
// HELPER: Buat a-plane (untuk efek 3D overlay)
// ============================================
function makePlane(w, h, color, opacity, z) {
  const p = document.createElement('a-plane');
  p.setAttribute('width', w);
  p.setAttribute('height', h);
  p.setAttribute('position', `0 0 ${z || 0}`);
  p.setAttribute('color', color);
  p.setAttribute('material',
    `shader: flat; color: ${color}; opacity: ${opacity}; side: double; transparent: true;`);
  return p;
}

// ============================================
// HELPER: a-plane kosong siap diberi canvas texture
// ============================================
function makeCanvasPlane(w, h, z) {
  const plane = document.createElement('a-plane');
  plane.setAttribute('width', w);
  plane.setAttribute('height', h);
  plane.setAttribute('position', `0 0 ${z}`);
  plane.setAttribute('material', 'shader: flat; side: double; transparent: true;');
  return plane;
}

// ============================================
// CANVAS HELPER: Wrap text ke array baris
// ============================================
function canvasWrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  words.forEach(w => {
    const candidate = current ? current + ' ' + w : w;
    if (ctx.measureText(candidate).width <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = w;
    }
  });
  if (current) lines.push(current);
  return lines;
}

// ============================================
// DRAW: Monitor Tengah (canvas statis, digambar sekali)
// ============================================
function drawCenterCanvas(canvas, tokoh, img, aksen, alert) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  const pad = 18;
  const aksenRgb = hexToRgb(aksen);

  ctx.clearRect(0, 0, W, H);

  // Background
  ctx.fillStyle = '#000d1f';
  ctx.fillRect(0, 0, W, H);

  // Scanline texture (statis)
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 2);
  }

  // Border glow
  const bw = 3;
  ctx.strokeStyle = aksen;
  ctx.lineWidth = bw;
  ctx.shadowColor = aksen;
  ctx.shadowBlur = 12;
  ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw);
  ctx.shadowBlur = 0;

  // === HEADER AREA ===
  const headerH = Math.round(H * 0.14);

  const headerGrad = ctx.createLinearGradient(0, 0, 0, headerH);
  headerGrad.addColorStop(0, `rgba(${aksenRgb},0.25)`);
  headerGrad.addColorStop(1, `rgba(${aksenRgb},0.05)`);
  ctx.fillStyle = headerGrad;
  ctx.fillRect(pad, 0, W - pad * 2, headerH);

  // Nama tokoh
  const namaFontSize = Math.round(W * 0.072);
  ctx.font = `bold ${namaFontSize}px 'Courier New', monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = aksen;
  ctx.shadowBlur = 8;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const namaWords = tokoh.nama.split(' ');
  if (namaWords.length <= 2) {
    ctx.fillText(tokoh.nama, W / 2, headerH / 2);
  } else {
    const half = Math.ceil(namaWords.length / 2);
    const line1 = namaWords.slice(0, half).join(' ');
    const line2 = namaWords.slice(half).join(' ');
    const lineH = namaFontSize * 1.2;
    ctx.fillText(line1, W / 2, headerH / 2 - lineH / 2);
    ctx.fillText(line2, W / 2, headerH / 2 + lineH / 2);
  }
  ctx.shadowBlur = 0;

  // Divider bawah header
  ctx.fillStyle = aksen;
  ctx.fillRect(pad * 2, headerH, W - pad * 4, 2);

  // === FOTO AREA ===
  const photoAreaTop = headerH + 12;
  const photoAreaBot = H - Math.round(H * 0.18);

  const frameW = W - pad * 2;
  const frameH = photoAreaBot - photoAreaTop;
  const frameX = pad;
  const frameY = photoAreaTop;

  ctx.fillStyle = '#000810';
  ctx.fillRect(frameX, frameY, frameW, frameH);

  if (img && img.complete && img.naturalWidth > 0) {
    const imgRatio = img.naturalWidth / img.naturalHeight;
    const frameRatio = frameW / frameH;
    let drawW, drawH, drawX, drawY;
    if (imgRatio > frameRatio) {
      drawH = frameH;
      drawW = drawH * imgRatio;
      drawX = frameX + (frameW - drawW) / 2;
      drawY = frameY;
    } else {
      drawW = frameW;
      drawH = drawW / imgRatio;
      drawX = frameX;
      drawY = frameY + (frameH - drawH) / 2;
    }
    ctx.save();
    ctx.rect(frameX, frameY, frameW, frameH);
    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);

    ctx.fillStyle = `rgba(${aksenRgb},0.12)`;
    ctx.fillRect(frameX, frameY, frameW, frameH);

    ctx.fillStyle = 'rgba(0,0,0,0.10)';
    for (let y = frameY; y < frameY + frameH; y += 3) {
      ctx.fillRect(frameX, y, frameW, 1);
    }
    ctx.restore();
  } else {
    ctx.fillStyle = `rgba(${aksenRgb},0.08)`;
    ctx.fillRect(frameX, frameY, frameW, frameH);
    ctx.font = `bold ${Math.round(W * 0.06)}px 'Courier New', monospace`;
    ctx.fillStyle = `rgba(${aksenRgb},0.5)`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('NO SIGNAL', W / 2, frameY + frameH / 2);
  }

  // Foto frame border cyan
  ctx.strokeStyle = aksen;
  ctx.lineWidth = 2;
  ctx.shadowColor = aksen;
  ctx.shadowBlur = 10;
  ctx.strokeRect(frameX, frameY, frameW, frameH);
  ctx.shadowBlur = 0;

  // Corner brackets di sudut foto
  const cbSize = 22;
  const cbThick = 3;
  ctx.fillStyle = alert;
  [
    [frameX, frameY, 1, 1],
    [frameX + frameW, frameY, -1, 1],
    [frameX, frameY + frameH, 1, -1],
    [frameX + frameW, frameY + frameH, -1, -1]
  ].forEach(([cx, cy, dx, dy]) => {
    ctx.fillRect(cx, cy, dx * cbSize, cbThick * dy);
    ctx.fillRect(cx, cy, cbThick * dx, dy * cbSize);
  });

  // === FOOTER AREA ===
  const footerTop = photoAreaBot + 10;

  ctx.fillStyle = aksen;
  ctx.fillRect(pad * 2, photoAreaBot + 4, W - pad * 4, 2);

  const gelarFontSize = Math.round(W * 0.045);
  ctx.font = `${gelarFontSize}px 'Courier New', monospace`;
  ctx.fillStyle = aksen;
  ctx.shadowColor = aksen;
  ctx.shadowBlur = 6;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(tokoh.gelar, W / 2, footerTop);
  ctx.shadowBlur = 0;

  const recFontSize = Math.round(W * 0.038);
  ctx.font = `bold ${recFontSize}px 'Courier New', monospace`;
  ctx.fillStyle = alert;
  ctx.shadowColor = alert;
  ctx.shadowBlur = 8;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.fillText('● REC | LIVE FEED', W / 2, H - 10);
  ctx.shadowBlur = 0;

  // Corner brackets sudut monitor
  const mcbSize = 28;
  const mcbThick = 4;
  ctx.fillStyle = aksen;
  [
    [bw, bw, 1, 1],
    [W - bw, bw, -1, 1],
    [bw, H - bw, 1, -1],
    [W - bw, H - bw, -1, -1]
  ].forEach(([cx, cy, dx, dy]) => {
    ctx.fillRect(cx, cy, dx * mcbSize, mcbThick * dy);
    ctx.fillRect(cx, cy, mcbThick * dx, dy * mcbSize);
  });
}

// ============================================
// DRAW: Layer statis monitor samping
// ============================================
function drawSideBackground(canvas) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = '#000d1f';
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  for (let y = 0; y < H; y += 4) {
    ctx.fillRect(0, y, W, 2);
  }
}

function drawSideChrome(canvas, side, aksen, alert) {
  const W = canvas.width;
  const H = canvas.height;
  const ctx = canvas.getContext('2d');
  const pad = 14;
  const headerH = Math.round(H * 0.13);
  const alertRgb = hexToRgb(alert);
  const title = side === 'left' ? '▸ ID_DATA' : '▸ HISTORY_LOG';

  ctx.clearRect(0, 0, W, H);

  // Header bar
  const headerGrad = ctx.createLinearGradient(0, 0, 0, headerH);
  headerGrad.addColorStop(0, `rgba(${alertRgb},0.55)`);
  headerGrad.addColorStop(1, `rgba(${alertRgb},0.15)`);
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, W, headerH);

  // Title
  const titleFontSize = Math.round(W * 0.058);
  ctx.font = `bold ${titleFontSize}px 'Courier New', monospace`;
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 6;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(title, W / 2, headerH / 2);
  ctx.shadowBlur = 0;

  // Divider
  ctx.fillStyle = aksen;
  ctx.shadowColor = aksen;
  ctx.shadowBlur = 8;
  ctx.fillRect(pad, headerH, W - pad * 2, 2);
  ctx.shadowBlur = 0;

  // Fade mask atas & bawah area konten
  const contentAreaTop = headerH + 2;
  const fadeH = Math.round((H - contentAreaTop) * 0.12);

  const gradTop = ctx.createLinearGradient(0, contentAreaTop, 0, contentAreaTop + fadeH);
  gradTop.addColorStop(0, '#000d1f');
  gradTop.addColorStop(1, 'rgba(0,13,31,0)');
  ctx.fillStyle = gradTop;
  ctx.fillRect(0, contentAreaTop, W, fadeH);

  const gradBot = ctx.createLinearGradient(0, H - fadeH, 0, H);
  gradBot.addColorStop(0, 'rgba(0,13,31,0)');
  gradBot.addColorStop(1, '#000d1f');
  ctx.fillStyle = gradBot;
  ctx.fillRect(0, H - fadeH, W, fadeH);

  // Border
  const bw = 3;
  ctx.strokeStyle = aksen;
  ctx.lineWidth = bw;
  ctx.shadowColor = aksen;
  ctx.shadowBlur = 12;
  ctx.strokeRect(bw / 2, bw / 2, W - bw, H - bw);
  ctx.shadowBlur = 0;

  // Corner brackets
  const cbSize = 22;
  const cbThick = 3;
  ctx.fillStyle = alert;
  [
    [bw, bw, 1, 1],
    [W - bw, bw, -1, 1],
    [bw, H - bw, 1, -1],
    [W - bw, H - bw, -1, -1]
  ].forEach(([cx, cy, dx, dy]) => {
    ctx.fillRect(cx, cy, dx * cbSize, cbThick * dy);
    ctx.fillRect(cx, cy, cbThick * dx, dy * cbSize);
  });
}

// ============================================
// DRAW: Konten monitor samping (canvas tinggi, digambar sekali)
// ============================================
function buildSideContent(tokoh, side) {
  const fields = [];

  if (side === 'left') {
    fields.push({ label: 'NEGARA', value: tokoh.negara });
    fields.push({ label: 'PERIODE', value: tokoh.periode });
    fields.push({ label: 'KONTEKS', value: tokoh.konteks });
    fields.push({ label: 'IDEOLOGI', value: tokoh.ideologi });
    fields.push({ label: 'KODE', value: tokoh.kode || 'XX-000' });
  } else {
    fields.push({ label: 'DAMPAK', value: tokoh.dampak });
    fields.push({ label: 'PELAJARAN', value: tokoh.pelajaran });

    if (tokoh.timeline && tokoh.timeline.length > 0) {
      fields.push({ label: 'TIMELINE', value: null });
      tokoh.timeline.forEach(evt => {
        const peristiwa = evt.peristiwa || evt.periode || '';
        fields.push({ label: null, value: `▸ ${evt.tahun}  ${peristiwa}`, isTimelineItem: true });
      });
    }

    if (tokoh.tags && tokoh.tags.length > 0) {
      fields.push({ label: 'KATEGORI', value: null });
      tokoh.tags.forEach(tag => {
        fields.push({ label: null, value: `[ ${tag} ]`, isTag: true });
      });
    }
  }

  return fields;
}

function drawSideOffscreen(W, tokoh, side, aksen, alert) {
  const fields = buildSideContent(tokoh, side);

  const pad = 20;
  const maxTextW = W - pad * 2;
  const labelFontSize = Math.round(W * 0.048);
  const valueFontSize = Math.round(W * 0.052);
  const aksenRgb = hexToRgb(aksen);

  const offCtx = document.createElement('canvas').getContext('2d');
  offCtx.canvas.width = W;

  let totalH = pad;

  const measurements = fields.map(f => {
    let itemH = 0;
    if (f.label && f.value !== null) {
      itemH += labelFontSize * 1.3;
      offCtx.font = `${valueFontSize}px 'Courier New', monospace`;
      const valueLines = f.value.split('\n').flatMap(line =>
        canvasWrapText(offCtx, line, maxTextW)
      );
      itemH += valueLines.length * valueFontSize * 1.4;
      itemH += 20;
    } else if (f.label && f.value === null) {
      itemH += labelFontSize * 1.6;
    } else if (f.isTimelineItem || f.isTag) {
      offCtx.font = `${valueFontSize}px 'Courier New', monospace`;
      const valueLines = canvasWrapText(offCtx, f.value, maxTextW - 10);
      itemH += valueLines.length * valueFontSize * 1.4 + 8;
    }
    return { ...f, itemH };
  });

  measurements.forEach(m => { totalH += m.itemH; });
  totalH += pad;

  offCtx.canvas.height = Math.max(totalH, 10);
  offCtx.clearRect(0, 0, W, offCtx.canvas.height);

  let y = pad;

  measurements.forEach(f => {
    if (f.label && f.value !== null) {
      offCtx.font = `bold ${labelFontSize}px 'Courier New', monospace`;
      offCtx.fillStyle = aksen;
      offCtx.shadowColor = aksen;
      offCtx.shadowBlur = 5;
      offCtx.textAlign = 'left';
      offCtx.textBaseline = 'top';
      offCtx.fillText(f.label, pad, y);
      offCtx.shadowBlur = 0;
      y += labelFontSize * 1.3;

      offCtx.font = `${valueFontSize}px 'Courier New', monospace`;
      offCtx.fillStyle = '#d0eeff';
      offCtx.textBaseline = 'top';
      const valueLines = f.value.split('\n').flatMap(line =>
        canvasWrapText(offCtx, line, maxTextW)
      );
      valueLines.forEach(line => {
        offCtx.fillText(line, pad, y);
        y += valueFontSize * 1.4;
      });

      offCtx.fillStyle = `rgba(${aksenRgb},0.2)`;
      offCtx.fillRect(pad, y + 4, W - pad * 2, 1);
      y += 20;

    } else if (f.label && f.value === null) {
      offCtx.font = `bold ${labelFontSize}px 'Courier New', monospace`;
      offCtx.fillStyle = aksen;
      offCtx.shadowColor = aksen;
      offCtx.shadowBlur = 5;
      offCtx.textAlign = 'left';
      offCtx.textBaseline = 'top';
      offCtx.fillText(f.label, pad, y);
      offCtx.shadowBlur = 0;
      y += labelFontSize * 1.6;

    } else if (f.isTimelineItem) {
      offCtx.font = `${valueFontSize}px 'Courier New', monospace`;
      offCtx.fillStyle = '#ffffff';
      offCtx.textAlign = 'left';
      offCtx.textBaseline = 'top';
      const tLines = canvasWrapText(offCtx, f.value, maxTextW - 10);

      offCtx.fillStyle = alert;
      offCtx.fillRect(pad, y + valueFontSize * 0.4, 6, 6);

      offCtx.fillStyle = '#ffffff';
      tLines.forEach((line, i) => {
        offCtx.fillText(line, pad + 14, y + i * valueFontSize * 1.4);
      });
      y += tLines.length * valueFontSize * 1.4 + 8;

    } else if (f.isTag) {
      offCtx.font = `bold ${valueFontSize}px 'Courier New', monospace`;
      offCtx.fillStyle = alert;
      offCtx.shadowColor = alert;
      offCtx.shadowBlur = 5;
      offCtx.textAlign = 'left';
      offCtx.textBaseline = 'top';
      const tagLines = canvasWrapText(offCtx, f.value, maxTextW);
      tagLines.forEach((line, i) => {
        offCtx.fillText(line, pad, y + i * valueFontSize * 1.4);
      });
      offCtx.shadowBlur = 0;
      y += tagLines.length * valueFontSize * 1.4 + 8;
    }
  });

  return offCtx.canvas;
}

// ============================================
// AFRAME COMPONENTS
// ============================================
// Reusable temporaries — no per-frame allocations
const _camPos = new THREE.Vector3();
const _elPos = new THREE.Vector3();
const _worldQuat = new THREE.Quaternion();
const _parentQuat = new THREE.Quaternion();
const _yAxis = new THREE.Vector3(0, 1, 0);

AFRAME.registerComponent('billboard', {
  tick: function () {
    const camera = this.el.sceneEl.camera;
    if (!camera) return;
    camera.getWorldPosition(_camPos);
    this.el.object3D.getWorldPosition(_elPos);
    const worldAngleY = Math.atan2(_camPos.x - _elPos.x, _camPos.z - _elPos.z);
    _worldQuat.setFromAxisAngle(_yAxis, worldAngleY);
    if (this.el.object3D.parent) {
      this.el.object3D.parent.getWorldQuaternion(_parentQuat);
      _parentQuat.invert();
    } else {
      _parentQuat.identity();
    }
    this.el.object3D.quaternion.copy(_parentQuat.multiply(_worldQuat));
  }
});

AFRAME.registerComponent('reveal-anim', {
  schema: { duration: { type: 'number', default: 900 } },
  init: function () {
    this.startTime = null;
    this.el.object3D.scale.set(0.01, 0.01, 0.01);
  },
  tick: function (time) {
    if (this.startTime === null) this.startTime = time;
    const p = Math.min((time - this.startTime) / this.data.duration, 1);
    const c4 = (2 * Math.PI) / 3;
    const ease = p === 0 ? 0 : p === 1 ? 1 :
      Math.pow(2, -10 * p) * Math.sin((p * 10 - 0.75) * c4) + 1;
    this.el.object3D.scale.set(ease, ease, ease);
    if (p >= 1) this.el.removeAttribute('reveal-anim');
  }
});

AFRAME.registerComponent('scanline-sweep', {
  schema: {
    yMin: { type: 'number', default: -0.4 },
    yMax: { type: 'number', default: 0.4 },
    speed: { type: 'number', default: 0.7 },
    phase: { type: 'number', default: 0 }
  },
  tick: function (time) {
    const t = (time / 1000) * this.data.speed + this.data.phase;
    const p = (Math.sin(t) + 1) / 2;
    this.el.object3D.position.y = this.data.yMin + p * (this.data.yMax - this.data.yMin);
  }
});

AFRAME.registerComponent('data-float', {
  schema: {
    yMin: { type: 'number', default: -1 },
    yMax: { type: 'number', default: 1.5 },
    speed: { type: 'number', default: 0.3 },
    offset: { type: 'number', default: 0 }
  },
  tick: function (time) {
    const t = (time / 1000) * this.data.speed + this.data.offset;
    const p = (t % 1);
    this.el.object3D.position.y = this.data.yMin + p * (this.data.yMax - this.data.yMin);
    if (this.el.components.material && this.el.components.material.material) {
      this.el.components.material.material.opacity = Math.sin(p * Math.PI) * 0.85;
    }
  }
});

AFRAME.registerComponent('pulse', {
  schema: {
    maxScale: { type: 'number', default: 3 },
    duration: { type: 'number', default: 2500 },
    delay: { type: 'number', default: 0 }
  },
  init: function () { this.elapsed = -this.data.delay; },
  tick: function (time, delta) {
    this.elapsed += delta;
    if (this.elapsed < 0) { this.el.object3D.visible = false; return; }
    this.el.object3D.visible = true;
    const p = (this.elapsed % this.data.duration) / this.data.duration;
    const scale = 1 + p * (this.data.maxScale - 1);
    this.el.object3D.scale.set(scale, scale, 1);
    if (this.el.components.material && this.el.components.material.material) {
      this.el.components.material.material.opacity = Math.max(0, 1 - p) * 0.6;
    }
  }
});

// ============================================
// KOMPONEN: particle-float
// Animasi float naik-turun untuk partikel dekoratif
// ============================================
AFRAME.registerComponent('particle-float', {
  schema: {
    yMin: { type: 'number', default: -1.35 },
    yMax: { type: 'number', default: 1.35 },
    speed: { type: 'number', default: 0.2 },
    offset: { type: 'number', default: 0 }
  },
  init: function () {
    this._baseY = parseFloat(this.el.getAttribute('position').y) || 0;
  },
  tick: function (time) {
    const t = (time / 1000) * this.data.speed + this.data.offset;
    const range = this.data.yMax - this.data.yMin;
    const y = this.data.yMin + (Math.sin(t) + 1) / 2 * range;
    
    const pos = this.el.getAttribute('position');
    this.el.setAttribute('position', { x: pos.x, y: y, z: pos.z });
  }
});

AFRAME.registerComponent('blink', {
  schema: { speed: { type: 'number', default: 2 } },
  tick: function (time) {
    const opacity = 0.5 + 0.5 * Math.sin((time / 1000) * this.data.speed * Math.PI);
    if (this.el.components.material && this.el.components.material.material) {
      this.el.components.material.material.opacity = opacity;
    }
  }
});

// ============================================
// KOMPONEN: canvas-scroller
// Animasi scroll otomatis ke atas untuk konten monitor samping
// ============================================
AFRAME.registerComponent('canvas-scroller', {
  schema: {
    duration: { type: 'number', default: 12 },
    phase: { type: 'number', default: 0 },
    invert: { type: 'boolean', default: false }
  },
  init: function () {
    this._texture = null;
    this._maxOffset = 0;
    this._startTime = null;
  },
  setup: function (texture, maxOffset) {
    this._texture = texture;
    this._maxOffset = maxOffset;
    this._startTime = performance.now();
  },
  tick: function (time) {
    if (!this._texture || this._maxOffset <= 0) return;

    // Hitung progress berdasarkan durasi dan phase
    const cycleDuration = this.data.duration;
    let elapsed = (time - this._startTime) / 1000 + this.data.phase * cycleDuration;
    let t = (elapsed % cycleDuration) / cycleDuration;

    // Easing smoothstep: pergerakan lebih halus di awal & akhir siklus
    t = t * t * (3 - 2 * t);

    // off naik 0 → maxOffset (= 1 salinan penuh) → konten mengalir KE ATAS,
    // lalu langsung nyambung ke salinan berikutnya (seamless loop).
    let off = t * this._maxOffset;
    if (this.data.invert) off = this._maxOffset - off;

    this._texture.offset.y = off;
    this._texture.needsUpdate = true;
  }
});

// Terapkan texture sekali saat mesh siap, lalu lepas diri sendiri.
AFRAME.registerComponent('apply-textures-once', {
  init: function () { this._done = false; },
  tick: function () {
    if (this._done) return;
    if (this.el._applyAll && this.el._applyAll()) {
      this._done = true;
      this.el.removeAttribute('apply-textures-once');
    }
  }
});

AFRAME.registerComponent('marker-handler', {
  init: function () {
    const el = this.el;
    el.addEventListener('markerFound', () => {
      showInfoPanel({
        nama: el.dataset.nama,
        negara: el.dataset.negara,
        periode: el.dataset.periode,
        konteks: el.dataset.konteks,
        ideologi: el.dataset.ideologi,
        dampak: el.dataset.dampak,
        pelajaran: el.dataset.pelajaran
      });
    });
    el.addEventListener('markerLost', () => hideInfoPanel());
  }
});

function showInfoPanel(data) {
  document.getElementById('info-nama').textContent = data.nama;
  document.getElementById('info-meta').textContent =
    `${data.negara} • ${data.periode} • ${data.konteks}`;
  document.getElementById('info-ideologi').textContent = data.ideologi;
  document.getElementById('info-dampak').textContent = data.dampak;
  document.getElementById('info-pelajaran').textContent = data.pelajaran;
  document.getElementById('info-panel').style.display = 'block';
}
function hideInfoPanel() {
  document.getElementById('info-panel').style.display = 'none';
}

// ============================================
// MONITOR BUILDERS
// ============================================
function createMonitorFrame(worldW, worldH, position, rotation) {
  const monitor = document.createElement('a-entity');
  monitor.setAttribute('position', position);
  if (rotation) monitor.setAttribute('rotation', rotation);

  const frame = document.createElement('a-box');
  frame.setAttribute('position', '0 0 -0.025');
  frame.setAttribute('width', worldW + 0.04);
  frame.setAttribute('height', worldH + 0.04);
  frame.setAttribute('depth', '0.04');
  frame.setAttribute('material', 'color: #001428; metalness: 0.6; roughness: 0.4;');
  monitor.appendChild(frame);

  return monitor;
}

function createCenterMonitor(cfg) {
  const { canvasW, canvasH, worldW, worldH, position, rotation, aksen, scanPhase } = cfg;

  const monitor = createMonitorFrame(worldW, worldH, position, rotation);

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const plane = makeCanvasPlane(worldW, worldH, 0);
  monitor.appendChild(plane);

  const scan = makePlane(worldW - 0.06, 0.012, aksen, 0.65, 0.012);
  scan.setAttribute('scanline-sweep',
    `yMin: ${-worldH / 2 + 0.07}; yMax: ${worldH / 2 - 0.07}; speed: 0.75; phase: ${scanPhase}`);
  monitor.appendChild(scan);

  monitor._center = { canvas, plane };
  return monitor;
}

function createSideMonitor(cfg) {
  const { canvasW, canvasH, worldW, worldH, position, rotation, aksen, scanPhase } = cfg;

  const monitor = createMonitorFrame(worldW, worldH, position, rotation);

  // Background statis
  const bgCanvas = document.createElement('canvas');
  bgCanvas.width = canvasW;
  bgCanvas.height = canvasH;
  const bgPlane = makeCanvasPlane(worldW, worldH, 0);
  monitor.appendChild(bgPlane);

  // Konten (canvas tinggi, scroll via texture offset)
  const contentCanvas = document.createElement('canvas');
  contentCanvas.width = canvasW;
  const headerFrac = 0.13;
  const headerWorldH = worldH * headerFrac;
  const contentWorldW = worldW - 0.06;
  const contentWorldH = worldH - headerWorldH - 0.01;
  const contentPlane = makeCanvasPlane(contentWorldW, contentWorldH, 0.004);
  contentPlane.setAttribute('position', `0 ${-headerWorldH / 2} 0.004`);
  monitor.appendChild(contentPlane);

  // Chrome statis di depan konten
  const chromeCanvas = document.createElement('canvas');
  chromeCanvas.width = canvasW;
  chromeCanvas.height = canvasH;
  const chromePlane = makeCanvasPlane(worldW, worldH, 0.008);
  monitor.appendChild(chromePlane);

  // Scanline sweep
  const scan = makePlane(worldW - 0.06, 0.012, aksen, 0.65, 0.012);
  scan.setAttribute('scanline-sweep',
    `yMin: ${-worldH / 2 + 0.07}; yMax: ${worldH / 2 - 0.07}; speed: 0.75; phase: ${scanPhase}`);
  monitor.appendChild(scan);

  monitor._side = {
    bgCanvas, bgPlane,
    contentCanvas, contentPlane,
    chromeCanvas, chromePlane,
    canvasW, contentWorldW, contentWorldH
  };
  return monitor;
}

// ============================================
// TEXTURE APPLY (sekali saja)
// ============================================
function makeCanvasTexture(canvas) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = false;
  return tex;
}

function applyPlaneTexture(plane, canvas) {
  const mesh = plane.getObject3D('mesh');
  if (!mesh) return null;
  const tex = makeCanvasTexture(canvas);
  // Pakai MeshBasicMaterial agar texture offset/repeat (scroll) dijamin bekerja
  // dan tidak bergantung pada shader custom A-Frame.
  mesh.material = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false,
    opacity: 1
  });
  mesh.material.needsUpdate = true;
  return tex;
}

function applyCenterMonitor(mon, tokoh, img, aksen, alert) {
  const c = mon._center;
  if (c.applied) return true;
  if (!c.plane.getObject3D('mesh')) return false;
  drawCenterCanvas(c.canvas, tokoh, img, aksen, alert);
  applyPlaneTexture(c.plane, c.canvas);
  c.applied = true;
  return true;
}

function applySideMonitor(mon, tokoh, side, aksen, alert, duration, phase) {
  const s = mon._side;
  if (s.applied) return true;
  const bgMesh = s.bgPlane.getObject3D('mesh');
  const contentMesh = s.contentPlane.getObject3D('mesh');
  const chromeMesh = s.chromePlane.getObject3D('mesh');
  if (!bgMesh || !contentMesh || !chromeMesh) return false;

  // Layer statis — digambar sekali
  drawSideBackground(s.bgCanvas);
  drawSideChrome(s.chromeCanvas, side, aksen, alert);

  // Konten tinggi — digambar sekali, lalu diduplikasi vertikal agar loop mulus
  const offscreen = drawSideOffscreen(s.canvasW, tokoh, side, aksen, alert);
  const contentH = offscreen.height;

  // Canvas menampung 2 salinan konten yang identik & bersambung
  s.contentCanvas.height = contentH * 2;
  const cctx = s.contentCanvas.getContext('2d');
  cctx.clearRect(0, 0, s.contentCanvas.width, s.contentCanvas.height);
  cctx.drawImage(offscreen, 0, 0);          // salinan pertama
  cctx.drawImage(offscreen, 0, contentH);   // salinan kedua (langsung nyambung)

  // Texture
  applyPlaneTexture(s.bgPlane, s.bgCanvas);
  applyPlaneTexture(s.chromePlane, s.chromeCanvas);
  const contentTex = applyPlaneTexture(s.contentPlane, s.contentCanvas);
  if (!contentTex) return false;
  contentTex.wrapS = THREE.ClampToEdgeWrapping;
  contentTex.wrapT = THREE.RepeatWrapping;

  // Hitung window scroll: repeat.y = porsi canvas yang terlihat
  const worldPerPx = s.contentWorldW / s.canvasW;
  const windowPx = s.contentWorldH / worldPerPx;
  let repeatY = windowPx / s.contentCanvas.height;
  repeatY = Math.max(0.05, Math.min(1, repeatY));
  contentTex.repeat.set(1, repeatY);
  // Offset awal ditangani oleh komponen canvas-scroller (mulai dari atas konten).
  contentTex.offset.set(0, 0);
  contentTex.needsUpdate = true;

  // Loop seamless: offset harus bergerak tepat SATU salinan konten.
  // canvasHeight = 2 × contentH, sehingga satu salinan = contentH / canvasHeight = 0.5.
  const maxOffset = contentH / s.contentCanvas.height;
  s.contentPlane.setAttribute('canvas-scroller',
    `duration: ${duration}; phase: ${phase}; invert: true`);
  const comp = s.contentPlane.components['canvas-scroller'];
  if (comp) comp.setup(contentTex, maxOffset);

  s.applied = true;
  return true;
}

// ============================================
// BUILD MARKER
// ============================================
function buildMarker(tokoh) {
  const marker = document.createElement('a-marker');

  if (tokoh.markerType === 'hiro') {
    // marker.setAttribute('preset', 'hiro');
  } else if (tokoh.markerType === 'barcode') {
    marker.setAttribute('type', 'barcode');
    marker.setAttribute('value', tokoh.markerValue);
  } else if (tokoh.markerType === 'pattern') {
    marker.setAttribute('type', 'pattern');
    marker.setAttribute('url', tokoh.markerValue);
  }

  marker.setAttribute('marker-handler', '');
  marker.dataset.nama = tokoh.nama;
  marker.dataset.negara = tokoh.negara;
  marker.dataset.periode = tokoh.periode;
  marker.dataset.konteks = tokoh.konteks;
  marker.dataset.ideologi = tokoh.ideologi;
  marker.dataset.dampak = tokoh.dampak;
  marker.dataset.pelajaran = tokoh.pelajaran;

  const aksen = tokoh.warnaAksen || '#00e5ff';
  const alert = tokoh.warnaAlert || '#ff2a4d';
  const kode = tokoh.kode || 'XX-000';

  // FLOOR GRID
  const floorGroup = document.createElement('a-entity');
  floorGroup.setAttribute('position', '0 0.01 0');
  floorGroup.setAttribute('rotation', '-90 0 0');
  marker.appendChild(floorGroup);

  [1.8, 1.4, 1.0, 0.6].forEach((r, i) => {
    const ring = document.createElement('a-ring');
    ring.setAttribute('radius-inner', `${r}`);
    ring.setAttribute('radius-outer', `${r + 0.008}`);
    ring.setAttribute('color', aksen);
    ring.setAttribute('material',
      `shader: flat; color: ${aksen}; opacity: ${0.35 - i * 0.05}; side: double; transparent: true;`);
    floorGroup.appendChild(ring);
  });

  for (let i = 0; i < 3; i++) {
    const pulse = document.createElement('a-ring');
    pulse.setAttribute('radius-inner', '0.4');
    pulse.setAttribute('radius-outer', '0.44');
    pulse.setAttribute('color', aksen);
    pulse.setAttribute('material',
      `shader: flat; color: ${aksen}; opacity: 0.5; side: double; transparent: true;`);
    pulse.setAttribute('pulse', `maxScale: 4.5; duration: 3000; delay: ${i * 1000}`);
    floorGroup.appendChild(pulse);
  }

  // KONTAINER UTAMA - tiduran datar di atas marker
  const cc = document.createElement('a-entity');
  cc.setAttribute('position', '0 0.1 0');
  cc.setAttribute('rotation', '-90 0 0');
  cc.setAttribute('reveal-anim', 'duration: 1000');
  marker.appendChild(cc);

  // MONITOR KIRI - jarak sedang
  const leftMon = createSideMonitor({
    canvasW: 340, canvasH: 425,
    worldW: 0.75, worldH: 1.0,
    position: '-0.9 0 0.15',
    rotation: '0 35 0',
    aksen, alert,
    scanPhase: 0
  });
  cc.appendChild(leftMon);

  // MONITOR TENGAH - tetap di pusat, billboard akan membuatnya selalu menghadap
  const centerMon = createCenterMonitor({
    canvasW: 256, canvasH: 340,
    worldW: 0.9, worldH: 1.2,
    position: '0 0 0',
    rotation: '0 0 0',
    aksen,
    scanPhase: 0.5
  });
  cc.appendChild(centerMon);

  // MONITOR KANAN - jarak sedang
  const rightMon = createSideMonitor({
    canvasW: 340, canvasH: 425,
    worldW: 0.75, worldH: 1.0,
    position: '0.9 0 0.15',
    rotation: '0 -35 0',
    aksen, alert,
    scanPhase: 1.0
  });
  cc.appendChild(rightMon);

  // CONNECTION LINES
  [-0.55, 0.55].forEach(x => {
    const line = makePlane(0.1, 0.006, aksen, 0.5, 0.001);
    line.setAttribute('position', `${x} -1.05 0.001`);
    cc.appendChild(line);
  });

  // STATUS BAR BAWAH
  const statusBar = makePlane(2.5, 0.055, aksen, 0.12, 0.001);
  statusBar.setAttribute('position', `0 -1.22 0.001`);
  cc.appendChild(statusBar);

  const statusCanvas = document.createElement('canvas');
  statusCanvas.width = 512;
  statusCanvas.height = 24;
  const sCtx = statusCanvas.getContext('2d');
  sCtx.clearRect(0, 0, 512, 24);
  sCtx.font = 'bold 14px Courier New, monospace';
  sCtx.fillStyle = aksen;
  sCtx.textAlign = 'center';
  sCtx.textBaseline = 'middle';
  sCtx.shadowColor = aksen;
  sCtx.shadowBlur = 6;
  sCtx.fillText(
    `● SYSTEM ONLINE  |  TARGET: ${kode}  |  SCAN: 100%  |  ${new Date().toISOString().slice(0, 10)}`,
    256, 12
  );

  const statusPlane = document.createElement('a-plane');
  statusPlane.setAttribute('width', '2.5');
  statusPlane.setAttribute('height', '0.07');
  statusPlane.setAttribute('position', '0 -1.22 0.002');
  statusPlane.setAttribute('material', 'shader: flat; transparent: true;');
  cc.appendChild(statusPlane);

  // DATA PARTICLES
  for (let i = 0; i < 14; i++) {
    const p = makePlane(0.05, 0.008, aksen, 0.7, 0);
    const side = Math.random() > 0.5 ? 1 : -1;
    const x = side * (1.7 + Math.random() * 0.5);
    const z = (Math.random() - 0.5) * 0.3;
    const baseY = (Math.random() - 0.5) * 0.6;
    p.setAttribute('position', `${x} ${baseY} ${z}`);
    p.setAttribute('particle-float', `yMin: -0.6; yMax: 0.6; speed: ${0.15 + Math.random() * 0.25}; offset: ${Math.random() * Math.PI * 2}`);
    cc.appendChild(p);
  }

  // LED STATUS
  const led = document.createElement('a-circle');
  led.setAttribute('position', `-1.2 0.72 0.01`);
  led.setAttribute('radius', '0.018');
  led.setAttribute('color', alert);
  led.setAttribute('material', `shader: flat; color: ${alert}; opacity: 0.9;`);
  led.setAttribute('blink', 'speed: 1.5');
  cc.appendChild(led);

  // GLOW CONE
  const glow = document.createElement('a-cone');
  glow.setAttribute('position', '0 -1.15 0');
  glow.setAttribute('radius-bottom', '0.4');
  glow.setAttribute('radius-top', '1.4');
  glow.setAttribute('height', '0.5');
  glow.setAttribute('open-ended', 'true');
  glow.setAttribute('side', 'double');
  glow.setAttribute('material',
    `shader: flat; color: ${aksen}; opacity: 0.08; side: double; transparent: true;`);
  cc.appendChild(glow);

  // ============================================
  // APPLY TEXTURES SEKALI (canvas statis + scroll via offset)
  // ============================================
  let texturesApplied = false;
  let imgSettled = false;

  const img = new Image();
  img.crossOrigin = 'anonymous';

  function applyAll() {
    if (texturesApplied) return true;
    if (!imgSettled) return false;

    if (!applyCenterMonitor(centerMon, tokoh, img, aksen, alert)) return false;
    if (!applySideMonitor(leftMon, tokoh, 'left', aksen, alert, 10, 0)) return false;
    if (!applySideMonitor(rightMon, tokoh, 'right', aksen, alert, 12, 0.5)) return false;

    if (statusPlane.getObject3D('mesh')) {
      applyPlaneTexture(statusPlane, statusCanvas);
    }

    texturesApplied = true;
    console.log('✅ Canvas textures applied for', tokoh.nama);
    return true;
  }

  img.onload = function () {
    imgSettled = true;
    applyAll();
  };
  img.onerror = function () {
    console.warn('⚠️ Gagal load gambar:', tokoh.gambar);
    imgSettled = true;
    applyAll();
  };

  // Fallback tick: coba sampai mesh siap, lalu lepas diri
  const applier = document.createElement('a-entity');
  applier._applyAll = applyAll;
  applier.setAttribute('apply-textures-once', '');
  cc.appendChild(applier);

  img.src = resolveAssetPath(tokoh.gambar);

  return marker;
}

// ============================================
// LOAD DATA
// ============================================
fetch(resolveAssetPath('data/tokoh.json'))
  .then(res => {
    if (!res.ok) throw new Error(`Gagal load tokoh.json (${res.status})`);
    return res.json();
  })
  .then(data => {
    const scene = document.querySelector('a-scene');
    const camera = scene.querySelector('a-entity[camera]');
    data.tokoh.forEach(tokoh => {
      scene.insertBefore(buildMarker(tokoh), camera);
    });
    console.log(`✅ ${data.tokoh.length} Command Center dimuat.`);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    alert('Gagal memuat data. Cek console.');
  });
