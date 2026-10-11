import { useCallback, useEffect, useRef } from 'react';

// Efekt "click spark": po kliknięciu rozbiegają się krótkie kreski.
// Te same propsy co w oryginale (sparkColor, sparkSize, sparkRadius, sparkCount, duration, easing, extraScale),
// z kilkoma różnicami pod aplikację:
//  - jeden canvas na całe okno (position: fixed), więc wystarczy owinąć całą aplikację jednym <ClickSpark>,
//  - kliknięcia łapane są w fazie capture na dokumencie – działają też w modalach, które robią stopPropagation,
//  - pętla animacji chodzi tylko wtedy, gdy są jakieś iskry; canvas jest ostry na ekranach retina,
//  - bez iskier przy przeciąganiu, klikaniu w pola tekstowe i przy prefers-reduced-motion.

const EASINGS = {
  linear: (t) => t,
  'ease-in': (t) => t * t,
  'ease-in-out': (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  'ease-out': (t) => t * (2 - t),
};

const IGNORE = 'input, textarea, select, [contenteditable="true"], [data-no-spark]';

const ClickSpark = ({
  sparkColor = '#fff',
  sparkSize = 10,
  sparkRadius = 15,
  sparkCount = 8,
  duration = 400,
  easing = 'ease-out',
  extraScale = 1.0,
  children,
}) => {
  const canvasRef = useRef(null);
  const sparksRef = useRef([]);
  const rafRef = useRef(0);
  const downRef = useRef(null);

  // najnowsze propsy dostępne w stabilnych callbackach
  const opts = useRef({});
  opts.current = { sparkColor, sparkSize, sparkRadius, sparkCount, duration, extraScale, ease: EASINGS[easing] || EASINGS['ease-out'] };

  const viewport = () => ({
    w: document.documentElement.clientWidth || window.innerWidth,
    h: document.documentElement.clientHeight || window.innerHeight,
  });

  const draw = useCallback((now) => {
    const canvas = canvasRef.current;
    if (!canvas) { rafRef.current = 0; return; }
    const ctx = canvas.getContext('2d');
    const { w, h } = viewport();
    const dpr = canvas.width / w || 1;
    const { sparkColor: color, sparkSize: size, sparkRadius: radius, duration: dur, extraScale: scale, ease } = opts.current;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    sparksRef.current = sparksRef.current.filter((s) => {
      const elapsed = Math.max(0, now - s.startTime);
      if (elapsed >= dur) return false;
      const eased = ease(elapsed / dur);
      const distance = eased * radius * scale;
      const length = size * (1 - eased);
      ctx.beginPath();
      ctx.moveTo(s.x + distance * Math.cos(s.angle), s.y + distance * Math.sin(s.angle));
      ctx.lineTo(s.x + (distance + length) * Math.cos(s.angle), s.y + (distance + length) * Math.sin(s.angle));
      ctx.stroke();
      return true;
    });

    rafRef.current = sparksRef.current.length ? requestAnimationFrame(draw) : 0;
  }, []);

  const spawn = useCallback((x, y) => {
    const { sparkCount: count } = opts.current;
    const now = performance.now();
    for (let i = 0; i < count; i += 1) {
      sparksRef.current.push({ x, y, angle: (2 * Math.PI * i) / count, startTime: now });
    }
    if (!rafRef.current) rafRef.current = requestAnimationFrame(draw);
  }, [draw]);

  // rozmiar canvasa = okno przeglądarki × devicePixelRatio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const resize = () => {
      const { w, h } = viewport();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const onDown = (e) => { downRef.current = { x: e.clientX, y: e.clientY }; };
    const onClick = (e) => {
      if (reduced()) return;
      if (e.detail === 0) return;                                   // klik z klawiatury (Enter/Spacja)
      if (e.target instanceof Element && e.target.closest(IGNORE)) return;
      const d = downRef.current;
      if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 6) return;   // to było przeciągnięcie
      spawn(e.clientX, e.clientY);
    };

    document.addEventListener('pointerdown', onDown, true);
    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('pointerdown', onDown, true);
      document.removeEventListener('click', onClick, true);
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };
  }, [spawn]);

  return (
    <>
      {children}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          userSelect: 'none',
          zIndex: 3000,
        }}
      />
    </>
  );
};

export default ClickSpark;
