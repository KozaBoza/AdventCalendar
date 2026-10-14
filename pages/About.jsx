import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../lib/settings';
import Icon from '../components/Icons';
import { Footer, Logo, Toggles } from '../components/Chrome';
import '../styles/pages.css';


const FaqItem = ({ question, answer }) => {
  const [open, setOpen] = useState(false);
  const uid = useId();
  const panelId = `${uid}-panel`;

  return (
    <div className={`faq-item${open ? ' is-open' : ''}`}>
      <button
        type="button"
        className="faq-q"
        id={`${uid}-btn`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{question}</span>
        <span className="faq-plus" aria-hidden="true">+</span>
      </button>
      <div className="faq-a" id={panelId} role="region" aria-labelledby={`${uid}-btn`}>
        <div className="faq-a-inner">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
};

const About = () => {
  const { t } = useSettings();
  const questions = [1, 2, 3].map((n) => ({ q: t(`q${n}`), a: t(`a${n}`) }));

  return (
    <main className="page">
      <header className="topbar">
        <Link className="icon-btn back" to="/" aria-label={t('backHome')} title={t('backHome')}>
          <Icon name="arrowLeft" />
        </Link>
        <Toggles />
        <Logo />
      </header>

      <div className="about-layout">
        {/* na mobile: osobny ekran */}
        <section className="about-section" aria-label={t('aboutEyebrow')}>
          <article className="about-copy">
            <div className="about-orb" aria-hidden="true" />
            <div className="about-text">
              <p className="eyebrow">{t('aboutEyebrow')}</p>
              <h3>{t('aboutTitle1')}</h3>
              <p>{t('aboutBody')}</p>
            </div>
          </article>
        </section>

        {/* na mobile: osobny ekran */}
        <section className="about-section faq-panel" aria-labelledby="faq-title">
          <p className="eyebrow" id="faq-title">{t('faqPre')} <em>{t('faqEm')}</em></p>
          <div className="faq-list">
            {questions.map(({ q, a }) => (
              <FaqItem key={q} question={q} answer={a} />
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
};

export default About;
