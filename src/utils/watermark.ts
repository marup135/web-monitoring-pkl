export interface WatermarkOptions {
  type?: string; // e.g. "ABSEN MASUK", "ABSEN PULANG", "BUKTI KEGIATAN"
  userName?: string;
  timestamp?: Date | string;
  lat?: number | null;
  lng?: number | null;
}

export function applyWatermark(
  canvas: HTMLCanvasElement,
  options: WatermarkOptions
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  const now = options.timestamp ? new Date(options.timestamp) : new Date();
  const dateStr = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }) + ' WIB';

  const typeTag = options.type ? `[${options.type.toUpperCase()}]` : '[ABSENSI]';
  const nameStr = options.userName || 'User';
  const locStr = (options.lat != null && options.lng != null)
    ? `📍 Lat: ${options.lat.toFixed(5)}, Lng: ${options.lng.toFixed(5)}`
    : '📍 Lokasi: Tidak tersedia';

  // Responsive scale factor based on image width
  const baseScale = Math.max(width / 800, 0.6);
  const fontSizeHeader = Math.round(14 * baseScale);
  const fontSizeBody = Math.round(12 * baseScale);
  const padding = Math.round(12 * baseScale);
  const lineHeight = Math.round(18 * baseScale);

  ctx.save();

  const lines = [
    { text: `NEBOTRACK ${typeTag}`, font: `bold ${fontSizeHeader}px sans-serif`, color: '#60A5FA' },
    { text: `👤 ${nameStr}`, font: `${fontSizeBody}px sans-serif`, color: '#FFFFFF' },
    { text: `📅 ${dateStr} - ${timeStr}`, font: `${fontSizeBody}px sans-serif`, color: '#F3F4F6' },
    { text: locStr, font: `${fontSizeBody}px sans-serif`, color: '#9CA3AF' }
  ];

  let maxLineWidth = 0;
  lines.forEach(l => {
    ctx.font = l.font;
    const m = ctx.measureText(l.text);
    if (m.width > maxLineWidth) maxLineWidth = m.width;
  });

  const boxWidth = maxLineWidth + padding * 2;
  const boxHeight = lines.length * lineHeight + padding * 2;

  const boxX = Math.round(16 * baseScale);
  const boxY = height - boxHeight - Math.round(16 * baseScale);

  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = Math.max(1, Math.round(1 * baseScale));

  const radius = Math.round(8 * baseScale);

  if (typeof ctx.roundRect === 'function') {
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
    ctx.fill();
    ctx.stroke();
  } else {
    ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
    ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
  }

  let currentY = boxY + padding + fontSizeHeader;
  lines.forEach((l, idx) => {
    ctx.font = l.font;
    ctx.fillStyle = l.color;
    ctx.fillText(l.text, boxX + padding, currentY);
    if (idx < lines.length - 1) {
      currentY += lineHeight;
    }
  });

  ctx.restore();
}
