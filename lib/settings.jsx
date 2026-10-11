import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { messages } from './messages';
import ClickSpark from '../components/ClickSpark';
import '../styles/global.css';

const SettingsContext = createContext(null);

const KEY = { lang: 'cal-lang', color: 'cal-color', view: 'cal-view' };
const read = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } };

const detect = () => {
  const savedLang = read(KEY.lang);
  const lang = savedLang === 'pl' || savedLang === 'en'
    ? savedLang
    : (navigator.language?.toLowerCase().startsWith('pl') ? 'pl' : 'en');

  const savedColor = read(KEY.color);
  const color = savedColor === 'dark' || savedColor === 'light'
    ? savedColor
    : (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

  // widok okienek: 'grid' (wszystkie 24) albo 'scroll' (poziome przewijanie)
  const view = read(KEY.view) === 'scroll' ? 'scroll' : 'grid';
  return { lang, color, view };
};

const initial = detect();
// motyw ustawiany synchronicznie, jeszcze przed pierwszym renderem – bez błysku jasnego tła
document.documentElement.dataset.theme = initial.color;
document.documentElement.lang = initial.lang;

export function SettingsProvider({ children }) {
  const [lang, setLang] = useState(initial.lang);
  const [colorMode, setColorMode] = useState(initial.color);
  const [view, setView] = useState(initial.view);
  const [toast, setToast] = useState(null);
  const animTimer = useRef(null);

  useEffect(() => {
    document.documentElement.dataset.theme = colorMode;
    write(KEY.color, colorMode);
  }, [colorMode]);

  useEffect(() => {
    document.documentElement.lang = lang;
    write(KEY.lang, lang);
  }, [lang]);

  useEffect(() => { write(KEY.view, view); }, [view]);

  useEffect(() => {
    if (!toast) return undefined;
    const h = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(h);
  }, [toast]);

  useEffect(() => () => clearTimeout(animTimer.current), []);

  const t = useCallback((key, vars) => {
    let s = messages[lang]?.[key] ?? messages.en[key] ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, v);
    return s;
  }, [lang]);

  const toggleColorMode = useCallback(() => {
    const root = document.documentElement;
    root.classList.add('theme-anim');                  // płynne przejście wszystkich kolorów naraz
    clearTimeout(animTimer.current);
    animTimer.current = setTimeout(() => root.classList.remove('theme-anim'), 350);
    setColorMode((m) => (m === 'dark' ? 'light' : 'dark'));
  }, []);

  const toggleLang = useCallback(() => setLang((l) => (l === 'pl' ? 'en' : 'pl')), []);
  const toggleView = useCallback(() => setView((v) => (v === 'grid' ? 'scroll' : 'grid')), []);
  const notify = useCallback((message) => setToast({ id: Date.now(), message }), []);

  const value = useMemo(() => ({
    lang, setLang, toggleLang,
    colorMode, toggleColorMode,
    view, toggleView,
    notify,
    t,
  }), [lang, toggleLang, colorMode, toggleColorMode, view, toggleView, notify, t]);

  return (
    <SettingsContext.Provider value={value}>
      {/* iskry po kliknięciu: kolor dopasowany do trybu jasny/ciemny */}
      <ClickSpark
        sparkColor={colorMode === 'dark' ? '#ecebe7' : '#1d1d1d'}
        sparkSize={8}
        sparkRadius={14}
        sparkCount={8}
        duration={420}
      >
        {children}
      </ClickSpark>
      {toast && <div className="toast" role="status" key={toast.id}>{toast.message}</div>}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside <SettingsProvider>');
  return ctx;
};
