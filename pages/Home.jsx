import { Link } from 'react-router-dom';
import { useSettings } from '../lib/settings';
import { DEFAULT_THEME } from '../lib/themes';
import { Footer, Logo, Toggles } from '../components/Chrome';
import Windows from '../components/Windows';
import '../styles/pages.css';

const Home = () => {
  const { t } = useSettings();

  return (
    <main className="page">
      <header className="topbar">
        <Link className="topbar-link" to="/about">{t('whatIs')}</Link>
        <Toggles />
        <Logo />
      </header>

      <section className="stage">
        {/* okienka 1–24, przesuwane poziomo; kropka = scrollbar */}
        <Windows theme={DEFAULT_THEME} mode="scroll" interactive={false} focusIndex={1} />
        <Link className="btn is-solid" to="/create">{t('createCta')}</Link>
      </section>

      <Footer />
    </main>
  );
};

export default Home;
