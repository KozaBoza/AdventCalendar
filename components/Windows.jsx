import { useCallback, useEffect, useRef, useState } from 'react';
import { getDoorArt } from '../lib/themes';
import { useSettings } from '../lib/settings';
import '../styles/windows.css';

const Tile = ({ index, art, open, dimmed, interactive, onSelect, label, children }) => {
  const interactiveProps = interactive
    ? {
        role: 'button',
        tabIndex: 0,
        'aria-label': label,
        onClick: () => onSelect?.(index),
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect?.(index); }
        },
      }
    : { 'aria-hidden': true };

  return (
    <div
      className={`tile${open ? ' is-open' : ''}${dimmed ? ' is-dimmed' : ''}${interactive ? ' is-interactive' : ''}`}
      {...interactiveProps}
    >
      <div className="tile-face">{open ? children : null}</div>
      <div
        className={`tile-door${art.src ? '' : ' is-fallback'}${art.dim ? ' is-dim-art' : ''}`}
        style={art.src ? { backgroundImage: `url("${art.src}")` } : undefined}
      >
        {!art.src && <span>{index + 1}</span>}
      </div>
    </div>
  );
};

/**
 * Okienka 1..count w dwóch widokach:
 *  - mode="grid"   – wszystkie naraz (siatka)
 *  - mode="scroll" – jedno okienko za drugim, przewijane poziomo; kropka = scrollbar
 *
 * Przewijanie działa: dotykiem (natywnie), gładzikiem, kółkiem myszy (pionowe kółko przesuwa poziomo),
 * przeciąganiem myszą, strzałkami na klawiaturze oraz przez przeciąganie/kliknięcie kropki.
 */
const Windows = ({
  theme,
  mode = 'grid',
  count = 24,
  openIndexes = [],
  dimmed,
  interactive = true,
  focusIndex,
  onSelect,
  renderContent,
}) => {
  const { t, colorMode } = useSettings();
  const scrollerRef = useRef(null);
  const [progress, setProgress] = useState(0);

  const dragRef = useRef(null);          // przeciąganie myszą po okienkach
  const trackActive = useRef(false);     // przeciąganie kropki
  const suppressClick = useRef(false);   // po przeciągnięciu nie "klikamy" okienka
  const snapTimer = useRef(null);

  const updateProgress = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 0);
  }, []);

  // pozycja startowa
  useEffect(() => {
    if (mode !== 'scroll') return undefined;
    const el = scrollerRef.current;
    if (!el) return undefined;
    const first = el.querySelector('.tile');
    if (first) {
      const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
      el.scrollLeft = (focusIndex || 0) * (first.offsetWidth + gap);
    }
    updateProgress();
    window.addEventListener('resize', updateProgress);
    return () => window.removeEventListener('resize', updateProgress);
  }, [mode, focusIndex, updateProgress]);

  // kółko myszy + przeciąganie myszą
  useEffect(() => {
    if (mode !== 'scroll') return undefined;
    const el = scrollerRef.current;
    if (!el) return undefined;

    // na czas ręcznego przesuwania wyłączamy snap; po chwili wraca i dociąga do najbliższego okienka
    const releaseSnapSoon = () => {
      clearTimeout(snapTimer.current);
      snapTimer.current = setTimeout(() => el.classList.remove('is-scrubbing'), 160);
    };

    const onWheel = (e) => {
      if (e.ctrlKey) return;                                   // pinch-zoom
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) return;    // gładzik / shift+kółko: natywnie
      const max = el.scrollWidth - el.clientWidth;
      const right = e.deltaY > 0;
      // na krańcach oddajemy kółko stronie, żeby jej nie blokować
      if (max <= 0 || (right && el.scrollLeft >= max - 1) || (!right && el.scrollLeft <= 0)) return;
      e.preventDefault();
      el.classList.add('is-scrubbing');
      el.scrollLeft += e.deltaMode === 1 ? e.deltaY * 32 : e.deltaY;
      releaseSnapSoon();
    };

    const onMove = (e) => {
      const d = dragRef.current;
      if (!d) return;
      const dx = e.clientX - d.x;
      if (!d.moved) {
        if (Math.abs(dx) < 5) return;
        d.moved = true;
        el.classList.add('is-dragging');
      }
      el.scrollLeft = d.left - dx;
    };

    const onUp = () => {
      const d = dragRef.current;
      if (!d) return;
      dragRef.current = null;
      if (d.moved) {
        suppressClick.current = true;
        setTimeout(() => { suppressClick.current = false; }, 0);
        el.classList.remove('is-dragging');
      }
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      clearTimeout(snapTimer.current);
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [mode]);

  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;   // dotyk przewija natywnie
    dragRef.current = { x: e.clientX, left: scrollerRef.current.scrollLeft, moved: false };
  };

  const onClickCapture = (e) => {
    if (suppressClick.current) { e.stopPropagation(); e.preventDefault(); }
  };

  const stepBy = (dir) => {
    const el = scrollerRef.current;
    const first = el?.querySelector('.tile');
    if (!first) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: dir * (first.offsetWidth + gap), behavior: 'smooth' });
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); stepBy(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); stepBy(-1); }
  };

  // ---- kropka jako scrollbar (klik albo przeciąganie) ----
  const setFromTrack = (e) => {
    const el = scrollerRef.current;
    if (!el) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    el.scrollLeft = ratio * (el.scrollWidth - el.clientWidth);
  };
  const onTrackDown = (e) => {
    trackActive.current = true;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    scrollerRef.current?.classList.add('is-scrubbing');
    setFromTrack(e);
  };
  const onTrackMove = (e) => { if (trackActive.current) setFromTrack(e); };
  const onTrackUp = () => {
    trackActive.current = false;
    scrollerRef.current?.classList.remove('is-scrubbing');
  };

  const tiles = Array.from({ length: count }, (_, i) => (
    <Tile
      key={i}
      index={i}
      art={getDoorArt(theme, i + 1, colorMode)}
      open={openIndexes.includes(i)}
      dimmed={dimmed ? dimmed(i) : false}
      interactive={interactive}
      onSelect={onSelect}
      label={t('dayLabel', { n: i + 1 })}
    >
      {renderContent ? renderContent(i) : null}
    </Tile>
  ));

  if (mode === 'grid') {
    return <div className="windows windows-grid">{tiles}</div>;
  }

  return (
    <div className="windows windows-scroll">
      <div
        className="scroller"
        ref={scrollerRef}
        onScroll={updateProgress}
        onPointerDown={onPointerDown}
        onClickCapture={onClickCapture}
        onKeyDown={onKeyDown}
        tabIndex={0}
      >
        {tiles}
      </div>
      <div
        className="scroll-track"
        onPointerDown={onTrackDown}
        onPointerMove={onTrackMove}
        onPointerUp={onTrackUp}
        onPointerCancel={onTrackUp}
        aria-hidden="true"
      >
        <span className="scroll-dot" style={{ left: `${progress * 100}%` }} />
      </div>
    </div>
  );
};

export default Windows;
