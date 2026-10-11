// Obraz do relacji (Instagram / Facebook / Snapchat / TikTok): pionowy PNG 1080×1920 z otwartym okienkiem.
// Rysujemy ręcznie na <canvas> na podstawie opisu sceny (tło + elementy), bez bibliotek do zrzutów DOM:
// działa tak samo na każdym telefonie i nie zależy od CORS ani od ładowania fontów przez CSS.
import { CANVAS_SIZE } from '../components/DayContent';

const W = 1080;
const H = 1920;
const CARD = 880;              // bok kwadratu z okienkiem
const CARD_Y = 560;            // góra i dół ~250 px zostaje wolne (tam aplikacje społecznościowe nakładają swój interfejs)
const CARD_RADIUS = 36;

export const hasStoryContent = (content) => {
  if (!content) return false;
  if (typeof content === 'string') return content.trim() !== '';
  if (typeof content === 'object' && content.type === 'canvas') {
    return Boolean(content.background) || (content.elements || []).length > 0;
  }
  return false;
};

const loadImage = (src) => new Promise((resolve) => {
  if (!src) { resolve(null); return; }
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => resolve(img);
  img.onerror = () => resolve(null);          // brakujący obrazek nie blokuje całej relacji
  img.src = src;
});

// czeka na font (maks. 1,5 s), żeby napisy nie wyszły systemowym krojem
const ensureFont = async (family, weight = 300) => {
  if (!document.fonts?.load) return;
  try {
    await Promise.race([
      document.fonts.load(`${weight} 32px "${family}"`),
      new Promise((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch { /* brak fontu – zostanie zapasowy */ }
};

const roundRectPath = (ctx, x, y, w, h, r) => {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
};

const fontString = ({ italic, weight, size, family }) =>
  `${italic ? 'italic ' : ''}${weight} ${size}px "${family}", "Inter", system-ui, sans-serif`;

const wrapLines = (ctx, text, maxWidth) => {
  const lines = [];
  String(text).split('\n').forEach((paragraph) => {
    let line = '';
    paragraph.split(/\s+/).filter(Boolean).forEach((word) => {
      const test = line ? `${line} ${word}` : word;
      if (line && ctx.measureText(test).width > maxWidth) { lines.push(line); line = word; } else { line = test; }
    });
    lines.push(line);
  });
  return lines;
};

// skraca napis do podanej szerokości (z "…")
const fitText = (ctx, text, maxWidth) => {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > maxWidth) s = s.slice(0, -1);
  return `${s}…`;
};

// Rysuje okienko w układzie logicznym 400×400 (tak samo jak <DayContent>), przeskalowane do `size` px.
async function drawDoor(ctx, content, x, y, size) {
  const k = size / CANVAS_SIZE;
  const L = CANVAS_SIZE;

  ctx.save();
  ctx.translate(x, y);
  roundRectPath(ctx, 0, 0, size, size, CARD_RADIUS);
  ctx.clip();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.scale(k, k);
  ctx.fillStyle = '#000000';

  if (typeof content === 'string') {
    await ensureFont('Inter');
    ctx.font = fontString({ weight: 300, size: 24, family: 'Inter' });
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lines = wrapLines(ctx, content, L - 64);
    const lh = 24 * 1.3;
    const top = L / 2 - ((lines.length - 1) * lh) / 2;
    lines.forEach((line, i) => ctx.fillText(line, L / 2, top + i * lh));
    ctx.restore();
    return;
  }

  const elements = content.elements || [];
  const bg = await loadImage(content.background);
  if (bg) {
    const s = Math.max(L / bg.width, L / bg.height);                 // background-size: cover
    ctx.drawImage(bg, (L - bg.width * s) / 2, (L - bg.height * s) / 2, bg.width * s, bg.height * s);
  }

  const fonts = new Set(['Inter']);
  elements.forEach((el) => { if (el.type === 'text' && el.fontFamily) fonts.add(el.fontFamily); });
  await Promise.all([...fonts].map((f) => ensureFont(f)));
  const images = await Promise.all(elements.map((el) => (el.type === 'image' || el.type === 'sticker' ? loadImage(el.src) : null)));

  elements.forEach((el, i) => {
    ctx.save();
    ctx.translate((el.x / 100) * L, (el.y / 100) * L);
    ctx.rotate(((el.rotation || 0) * Math.PI) / 180);

    if (el.type === 'image' || el.type === 'sticker') {
      const img = images[i];
      if (img) {
        const w = el.width;
        const h = (w * img.height) / img.width;
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
      }
    } else if (el.type === 'text') {
      ctx.fillStyle = el.color || '#000000';
      ctx.font = fontString({ italic: el.italic, weight: el.bold ? 600 : 300, size: el.fontSize, family: el.fontFamily || 'Inter' });
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(el.content ?? '').replace(/\s*\n\s*/g, ' '), 0, 0);
    } else if (el.type === 'button') {
      const w = el.width;
      const h = el.fontSize * 2.3;
      ctx.fillStyle = '#000000';
      roundRectPath(ctx, -w / 2, -h / 2, w, h, h / 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = fontString({ weight: 300, size: el.fontSize, family: 'Inter' });
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(el.content ?? '', 0, 0);
    }
    ctx.restore();
  });

  ctx.restore();
}

/**
 * @returns {Promise<Blob>} PNG 1080×1920
 */
export async function renderStory({ content, dayLabel, calendarTitle, brand, colorMode = 'light' }) {
  await ensureFont('Inter');

  const dark = colorMode === 'dark';
  const palette = dark
    ? { bg: '#131312', ink: '#ecebe7', muted: '#9b9892' }
    : { bg: '#f1f0ed', ink: '#1d1d1d', muted: '#65635f' };

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = palette.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // nagłówek: numer dnia (+ tytuł dnia, jeśli jest)
  ctx.fillStyle = palette.ink;
  ctx.font = fontString({ weight: 300, size: 124, family: 'Inter' });
  if ('letterSpacing' in ctx) ctx.letterSpacing = '-4px';
  ctx.fillText(dayLabel, W / 2, 380);
  if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';

  const dayTitle = content && typeof content === 'object' ? String(content.title || '').trim() : '';
  if (dayTitle) {
    ctx.fillStyle = palette.muted;
    ctx.font = fontString({ weight: 300, size: 44, family: 'Inter' });
    ctx.fillText(fitText(ctx, dayTitle, CARD), W / 2, 468);
  }

  // karta z okienkiem + delikatny cień
  const cardX = (W - CARD) / 2;
  ctx.save();
  ctx.shadowColor = dark ? 'rgba(0, 0, 0, .5)' : 'rgba(0, 0, 0, .14)';
  ctx.shadowBlur = 70;
  ctx.shadowOffsetY = 24;
  ctx.fillStyle = '#ffffff';
  roundRectPath(ctx, cardX, CARD_Y, CARD, CARD, CARD_RADIUS);
  ctx.fill();
  ctx.restore();
  await drawDoor(ctx, content, cardX, CARD_Y, CARD);

  // stopka: tytuł kalendarza + nazwa aplikacji
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = palette.ink;
  ctx.font = fontString({ weight: 300, size: 56, family: 'Inter' });
  ctx.fillText(fitText(ctx, calendarTitle || '', CARD), W / 2, 1546);
  ctx.fillStyle = palette.muted;
  ctx.font = fontString({ weight: 300, size: 34, family: 'Inter' });
  ctx.fillText(brand, W / 2, 1610);

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('toBlob failed'))), 'image/png');
  });
}

const download = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

/**
 * Otwiera systemowy arkusz udostępniania z obrazem (na telefonie są w nim Instagram, Facebook, Snapchat…).
 * Gdy przeglądarka nie potrafi udostępniać plików (większość desktopów), zapisuje PNG na dysk.
 * @returns {'shared' | 'cancelled' | 'saved'}
 */
export async function shareOrSave(blob, { filename, title }) {
  const file = new File([blob], filename, { type: 'image/png' });
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return 'shared';
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled';     // użytkownik zamknął arkusz
      // inny błąd → spróbujmy chociaż zapisać plik
    }
  }
  download(blob, filename);
  return 'saved';
}
