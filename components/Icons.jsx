// Małe ikony liniowe (viewBox 24). d = ścieżki, c = koła [cx, cy, r], r = prostokąty [x, y, w, h, rx]
const ICONS = {
  moon: { d: ['M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z'] },
  sun: { c: [[12, 12, 4]], d: ['M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4'] },
  plus: { d: ['M12 5v14M5 12h14'] },
  x: { d: ['M18 6 6 18M6 6l12 12'] },
  check: { d: ['M20 6 9 17l-5-5'] },
  arrowLeft: { d: ['M19 12H5M12 19l-7-7 7-7'] },
  arrowRight: { d: ['M5 12h14M12 5l7 7-7 7'] },
  undo: { d: ['M3 7v6h6', 'M21 17a9 9 0 0 0-15-6.7L3 13'] },
  redo: { d: ['M21 7v6h-6', 'M3 17a9 9 0 0 1 15-6.7L21 13'] },
  image: { r: [[3, 3, 18, 18, 2]], c: [[8.5, 8.5, 1.5]], d: ['M21 15l-5-5L5 21'] },
  type: { d: ['M4 7V4h16v3M9 20h6M12 4v16'] },
  link: { d: ['M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7', 'M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7'] },
  smile: { c: [[12, 12, 9]], d: ['M8 14s1.5 2 4 2 4-2 4-2', 'M9 9h.01M15 9h.01'] },
  gift: { r: [[3, 8, 18, 4, 0]], d: ['M12 8v13M19 12v9H5v-9', 'M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5'] },
  layers: { d: ['M12 2 2 7l10 5 10-5-10-5z', 'M2 17l10 5 10-5', 'M2 12l10 5 10-5'] },
  share: { d: ['M4 12v8h16v-8M16 6l-4-4-4 4M12 2v14'] },
  palette: { c: [[7.5, 11, .6], [11, 7, .6], [16, 8, .6]], d: ['M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.2-1.6-.4-1 .2-2.4 1.5-2.4H17a4 4 0 0 0 4-4c0-5-4-10-9-10z'] },
  grid: { d: ['M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z'] },
  columns: { d: ['M3 4h4v16H3zM10 4h4v16h-4zM17 4h4v16h-4z'] },
  trash: { d: ['M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6'] },
  info: { c: [[12, 12, 9]], d: ['M12 16v-4M12 8h.01'] },
  copy: { r: [[9, 9, 13, 13, 2]], d: ['M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1'] },
  up: { d: ['M18 15l-6-6-6 6'] },
  down: { d: ['M6 9l6 6 6-6'] },
  external: { d: ['M18 13v6H5V6h6M15 3h6v6M10 14 21 3'] },
  pencil: { d: ['M12 20h9', 'M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z'] },
  rotate: { d: ['M21 12a9 9 0 1 1-3-6.7L21 8', 'M21 3v5h-5'] },
  resize: { d: ['M15 3h6v6', 'M9 21H3v-6', 'M21 3l-7 7', 'M3 21l7-7'] },
};

const Icon = ({ name }) => {
  const def = ICONS[name];
  if (!def) return null;
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {def.d?.map((d, i) => <path key={`d${i}`} d={d} />)}
      {def.c?.map(([cx, cy, r], i) => <circle key={`c${i}`} cx={cx} cy={cy} r={r} />)}
      {def.r?.map(([x, y, w, h, rx], i) => <rect key={`r${i}`} x={x} y={y} width={w} height={h} rx={rx} />)}
    </svg>
  );
};

export default Icon;
