// src/pages/Calendar.jsx – widok odbiorcy (/c/:id)
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { toZonedTime } from 'date-fns-tz';
import { db } from '../firebase';
import { useSettings } from '../lib/settings';
import { hasStoryContent, renderStory, shareOrSave } from '../lib/story';
import { AppBar, Footer, IconButton, Logo, Toggles } from '../components/Chrome';
import Windows from '../components/Windows';
import DayContent from '../components/DayContent';
import Modal from '../components/Modal';
import '../styles/pages.css';

const Calendar = () => {
  const { id } = useParams();
  const { t, view, toggleView, colorMode, lang, notify } = useSettings();

  const [calendar, setCalendar] = useState(null);
  const [sharing, setSharing] = useState(false);
  const storyRef = useRef({ key: null, promise: null });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [showLocked, setShowLocked] = useState(false);

  const storageKey = `calendar-${id}-opened`;
  const [openDoors, setOpenDoors] = useState(() => {
    try { return JSON.parse(localStorage.getItem(storageKey)) || []; } catch { return []; }
  });

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'calendars', id));
        if (snap.exists()) setCalendar(snap.data());
      } catch (error) {
        console.error('Error fetching:', error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const zonedNow = () => toZonedTime(new Date(), calendar?.timezone || 'UTC');

  const isUnlocked = (index) => {
    if (!calendar) return false;
    const now = zonedNow();
    const targetYear = calendar.year || now.getFullYear();
    if (now.getFullYear() > targetYear) return true;
    return now.getFullYear() === targetYear && now.getMonth() === 11 && now.getDate() >= index + 1;
  };

  const markOpen = (index) => {
    if (openDoors.includes(index)) return;
    const next = [...openDoors, index];
    setOpenDoors(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* storage blocked */ }
  };

  const handleSelect = (index) => {
    if (!isUnlocked(index)) { setShowLocked(true); return; }
    markOpen(index);
    setExpanded(index);
  };

  const canStep = (dir) => {
    const j = expanded + dir;
    return j >= 0 && j < calendar.days.length && isUnlocked(j);
  };
  const step = (dir) => {
    if (!canStep(dir)) return;
    markOpen(expanded + dir);
    setExpanded(expanded + dir);
  };

  // ---- udostępnianie okienka jako relacji ----
  // Obraz przygotowujemy z wyprzedzeniem (od razu po otwarciu okienka), bo np. iOS wymaga,
  // żeby arkusz udostępniania otworzył się tuż po dotknięciu przycisku – bez czekania na rysowanie.
  const ensureStory = useCallback((index) => {
    const key = `${index}|${colorMode}|${lang}`;
    if (storyRef.current.key !== key) {
      const promise = renderStory({
        content: calendar.days[index],
        dayLabel: t('dayLabel', { n: index + 1 }),
        calendarTitle: calendar.title,
        brand: t('appName'),
        colorMode,
      });
      storyRef.current = { key, promise };
      promise.catch(() => {
        if (storyRef.current.promise === promise) storyRef.current = { key: null, promise: null };
      });
    }
    return storyRef.current.promise;
  }, [calendar, colorMode, lang, t]);

  useEffect(() => {
    if (expanded === null || !calendar || !hasStoryContent(calendar.days[expanded])) return;
    ensureStory(expanded).catch(() => {});
  }, [expanded, calendar, ensureStory]);

  const handleShareStory = async () => {
    if (expanded === null || sharing) return;
    setSharing(true);
    try {
      const blob = await ensureStory(expanded);
      const result = await shareOrSave(blob, { filename: `callendar-day-${expanded + 1}.png`, title: calendar.title });
      if (result === 'saved') notify(t('storySaved'));
    } catch (error) {
      console.error('Story share failed:', error);
      notify(t('storyError'));
    } finally {
      setSharing(false);
    }
  };

  if (loading) return <div className="center-msg">{t('loading')}</div>;
  if (loadError) return <div className="center-msg">{t('errLoad')}</div>;
  if (!calendar) return <div className="center-msg">{t('notFound')}</div>;

  // w grudniu przewijany widok startuje na dzisiejszym dniu
  const now = zonedNow();
  const focusIndex = now.getMonth() === 11 && now.getFullYear() === (calendar.year || now.getFullYear())
    ? Math.min(now.getDate(), calendar.days.length) - 1
    : 0;

  return (
    <main className="page">
      <AppBar left={<Logo />}>
        <IconButton
          icon={view === 'grid' ? 'columns' : 'grid'}
          label={view === 'grid' ? t('viewToScroll') : t('viewToGrid')}
          onClick={toggleView}
        />
        <Toggles />
      </AppBar>

      <div className="view-head">
        <h2>{calendar.title}</h2>
        <p>{calendar.description || t('giftDefault')}</p>
      </div>

      <div className="cal-body">
        <Windows
          key={view}
          theme={calendar.theme}
          mode={view}
          count={calendar.days.length}
          openIndexes={openDoors}
          dimmed={(i) => !isUnlocked(i)}
          focusIndex={focusIndex}
          onSelect={handleSelect}
          renderContent={(i) => <DayContent content={calendar.days[i]} />}
        />
      </div>

      <Footer />

      {expanded !== null && (
        <Modal variant="bare" onClose={() => setExpanded(null)} title={t('dayLabel', { n: expanded + 1 })}>
          <div className="day-card">
            <DayContent content={calendar.days[expanded]} />
          </div>
          <div className="day-actions">
            <IconButton large solid icon="x" label={t('close')} onClick={() => setExpanded(null)} />
            <span className="spacer" />
            {hasStoryContent(calendar.days[expanded]) && (
              <IconButton large icon="share" label={t('shareStory')} disabled={sharing} onClick={handleShareStory} />
            )}
            <IconButton large icon="arrowLeft" label={t('prev')} disabled={!canStep(-1)} onClick={() => step(-1)} />
            <IconButton large icon="arrowRight" label={t('next')} disabled={!canStep(1)} onClick={() => step(1)} />
          </div>
        </Modal>
      )}

      {showLocked && (
        <Modal title={t('soonTitle')} onClose={() => setShowLocked(false)}>
          <p>{t('soonText')}</p>
          <div className="dlg-actions">
            <button type="button" className="btn is-solid" onClick={() => setShowLocked(false)}>{t('okay')}</button>
          </div>
        </Modal>
      )}
    </main>
  );
};

export default Calendar;
