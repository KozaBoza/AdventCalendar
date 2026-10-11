// src/pages/Edit.jsx – widok właściciela (/edit/:id?token=...)
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useSettings } from '../lib/settings';
import { shake } from '../lib/ui';
import { THEMES, getDoorSrc } from '../lib/themes';
import { AppBar, Footer, IconButton, Logo, Toggles } from '../components/Chrome';
import Windows from '../components/Windows';
import Modal from '../components/Modal';
import TimezoneSelect from '../components/TimezoneSelect';
import '../styles/pages.css';

const isEmptyDay = (content) => {
  if (!content) return true;
  if (typeof content === 'string') return content.trim() === '';
  if (typeof content === 'object' && content.type === 'canvas') {
    return !content.background && !(content.elements || []).length;
  }
  return false;
};

const Edit = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, view, toggleView, colorMode, notify } = useSettings();
  const nameRef = useRef(null);

  const token = searchParams.get('token');
  const publicLink = `${window.location.origin}/c/${id}`;
  const editLink = `${window.location.origin}/edit/${id}?token=${token}`;

  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [modal, setModal] = useState(location.state?.justCreated ? 'details' : null); // 'details' | 'theme' | 'share'
  const [copied, setCopied] = useState(null);
  const [nameError, setNameError] = useState(false);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'calendars', id));
        if (snap.exists()) {
          const data = snap.data();
          if (data.editToken && data.editToken !== token) {
            navigate(`/c/${id}`, { replace: true });
            return;
          }
          setCalendar(data);
          setName(data.title || '');
        }
      } catch (error) {
        console.error('Error loading calendar:', error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, token, navigate]);

  // zapis z natychmiastową aktualizacją widoku; przy błędzie cofa zmianę i pokazuje komunikat
  const patch = async (fields) => {
    const previous = calendar;
    setCalendar((c) => ({ ...c, ...fields }));
    try {
      await updateDoc(doc(db, 'calendars', id), fields);
      return true;
    } catch (error) {
      console.error('Error saving:', error);
      setCalendar(previous);
      notify(t('errSave'));
      return false;
    }
  };

  const commitName = async () => {
    const clean = name.trim();
    if (!clean) {
      setNameError(true);
      shake(nameRef.current);
      return;
    }
    setNameError(false);
    if (clean === calendar.title) { setName(clean); return; }
    const ok = await patch({ title: clean });
    if (ok) setName(clean); else setName(calendar.title || '');
  };

  const copy = async (text, key) => {
    try { await navigator.clipboard.writeText(text); } catch { /* clipboard blocked */ }
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  if (loading) return <div className="center-msg">{t('loading')}</div>;
  if (loadError) return <div className="center-msg">{t('errLoad')}</div>;
  if (!calendar) return <div className="center-msg">{t('notFound')}</div>;

  const currentTheme = calendar.theme || 'classic';

  return (
    <main className="page">
      <AppBar left={<Logo />} title={t('appName')}>
        <Toggles />
        <IconButton solid icon="plus" label={t('newCalendar')} onClick={() => navigate('/create')} />
      </AppBar>

      <div className="cal-toolbar-wrap">
        <div className="cal-toolbar">
          <IconButton large solid icon="info" label={t('details')} onClick={() => setModal('details')} />
          <input
            ref={nameRef}
            className="cal-name"
            value={name}
            maxLength={60}
            placeholder={t('calendarName')}
            aria-label={t('calendarName')}
            aria-invalid={nameError ? true : undefined}
            aria-describedby={nameError ? 'cal-name-err' : undefined}
            onChange={(e) => { setName(e.target.value); if (nameError) setNameError(false); }}
            onBlur={commitName}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
          />
          <IconButton
            large
            icon={view === 'grid' ? 'columns' : 'grid'}
            label={view === 'grid' ? t('viewToScroll') : t('viewToGrid')}
            onClick={toggleView}
          />
          <IconButton large icon="palette" label={t('theme')} onClick={() => setModal('theme')} />
          <IconButton large icon="share" label={t('share')} onClick={() => setModal('share')} />
        </div>
        {nameError && <p className="field-error" id="cal-name-err" role="alert">{t('errName')}</p>}
      </div>

      <div className="cal-body">
        <Windows
          key={view}
          theme={currentTheme}
          mode={view}
          count={calendar.days.length}
          dimmed={(i) => isEmptyDay(calendar.days[i])}
          onSelect={(i) => navigate(`/edit/${id}/door/${i + 1}?token=${token}`)}
        />
      </div>

      <Footer />

      {modal === 'details' && (
        <Modal title={t('details')} onClose={() => setModal(null)}>
          <div className="field">
            <label htmlFor="e-desc">{t('fDescription')}</label>
            <textarea
              id="e-desc"
              rows={4}
              defaultValue={calendar.description || ''}
              onBlur={(e) => { if (e.target.value !== (calendar.description || '')) patch({ description: e.target.value }); }}
            />
          </div>
          <div className="field">
            <label htmlFor="e-tz">{t('fTimezone')}</label>
            <TimezoneSelect id="e-tz" value={calendar.timezone || 'UTC'} onChange={(tz) => patch({ timezone: tz })} />
          </div>
          <p>{t('editLinkLabel')}</p>
          <div className="link-row">
            <span>{editLink}</span>
            <button type="button" className="btn is-solid" onClick={() => copy(editLink, 'edit')}>
              {copied === 'edit' ? t('copied') : t('copyLink')}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'theme' && (
        <Modal title={t('chooseTheme')} onClose={() => setModal(null)}>
          <div className="theme-grid">
            {THEMES.map((th) => {
              const src = getDoorSrc(th.id, 1, colorMode);
              return (
                <button
                  key={th.id}
                  type="button"
                  className={`theme-opt${currentTheme === th.id ? ' is-selected' : ''}`}
                  onClick={() => { patch({ theme: th.id }); setModal(null); }}
                >
                  {src
                    ? <img className="swatch" src={src} alt="" style={{ objectFit: 'contain' }} />
                    : <span className="swatch" aria-hidden="true" />}
                  <span>{th.id}</span>
                </button>
              );
            })}
          </div>
        </Modal>
      )}

      {modal === 'share' && (
        <Modal title={t('share')} onClose={() => setModal(null)}>
          <p>{t('shareText')}</p>
          <div className="link-row"><span>{publicLink}</span></div>
          <div className="dlg-actions">
            <a className="btn" href={publicLink} target="_blank" rel="noreferrer">{t('open')}</a>
            <button type="button" className="btn is-solid" onClick={() => copy(publicLink, 'public')}>
              {copied === 'public' ? t('copied') : t('copyLink')}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
};

export default Edit;
