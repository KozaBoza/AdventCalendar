import { useRef, useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { useSettings } from '../lib/settings';
import { browserTimezone } from '../lib/timezones';
import { DEFAULT_THEME } from '../lib/themes';
import { shake } from '../lib/ui';
import { AppBar, Footer, IconButton, Logo, Toggles } from '../components/Chrome';
import Field from '../components/Field';
import TimezoneSelect from '../components/TimezoneSelect';
import '../styles/pages.css';

const makeToken = () => {
  if (crypto?.randomUUID) return crypto.randomUUID().replace(/-/g, '');
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
};

const Create = () => {
  const navigate = useNavigate();
  const { t, notify } = useSettings();
  const titleRef = useRef(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [timezone, setTimezone] = useState(browserTimezone());
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setErrors({ title: t('errTitle') });
      titleRef.current?.focus();
      shake(titleRef.current);
      return;
    }

    setLoading(true);
    const editToken = makeToken();

    try {
      const docRef = await addDoc(collection(db, 'calendars'), {
        title: cleanTitle,
        description: description.trim(),
        timezone,
        days: Array(24).fill(''),
        createdAt: new Date(),
        year: new Date().getFullYear(),
        theme: DEFAULT_THEME,
        editToken,
      });
      // state.justCreated → strona edycji od razu pokaże tajny link
      navigate(`/edit/${docRef.id}?token=${editToken}`, { state: { justCreated: true } });
    } catch (error) {
      console.error('Error:', error);
      notify(t('createError'));
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <AppBar
        left={<IconButton icon="arrowLeft" label={t('back')} onClick={() => navigate('/')} />}
        title={t('appName')}
      >
        <Toggles />
        <Logo />
      </AppBar>

      <div className="create-wrap">
        <form className="card" onSubmit={handleSubmit} noValidate>
          <h2>{t('newCalendar')}</h2>

          <Field id="c-title" label={t('fTitle')} required error={errors.title}>
            {(p) => (
              <input
                {...p}
                ref={titleRef}
                type="text"
                maxLength={60}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors({});
                }}
              />
            )}
          </Field>

          <Field id="c-desc" label={t('fDescription')}>
            {(p) => (
              <textarea {...p} rows={5} maxLength={400} value={description} onChange={(e) => setDescription(e.target.value)} />
            )}
          </Field>

          <Field id="c-tz" label={t('fTimezone')}>
            {(p) => <TimezoneSelect {...p} value={timezone} onChange={setTimezone} />}
          </Field>

          <button type="submit" className="btn is-solid" disabled={loading}>
            {loading ? t('creating') : t('create')}
          </button>
        </form>
      </div>

      <Footer />
    </main>
  );
};

export default Create;
