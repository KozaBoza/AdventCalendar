import { Link } from 'react-router-dom';
import { useSettings } from '../lib/settings';
import Icon from './Icons';

export const IconButton = ({ icon, label, solid, active, large, className = '', children, ...rest }) => (
  <button
    type="button"
    className={`icon-btn${solid ? ' is-solid' : ''}${active ? ' is-active' : ''}${large ? ' is-large' : ''} ${className}`}
    aria-label={label}
    title={label}
    {...rest}
  >
    {icon ? <Icon name={icon} /> : children}
  </button>
);

export const Logo = ({ to = '/' }) => {
  const { t } = useSettings();
  return <Link className="logo-placeholder" to={to} aria-label={t('appName')} />;
};

// przełączniki: tryb jasny/ciemny + język PL/EN
export const Toggles = () => {
  const { t, lang, toggleLang, colorMode, toggleColorMode } = useSettings();
  const dark = colorMode === 'dark';
  return (
    <>
      <IconButton icon={dark ? 'sun' : 'moon'} label={dark ? t('lightMode') : t('darkMode')} onClick={toggleColorMode} />
      <IconButton label={t('language')} onClick={toggleLang}>{lang === 'pl' ? 'EN' : 'PL'}</IconButton>
    </>
  );
};

export const AppBar = ({ left, title, children }) => (
  <header className="appbar">
    <div className="appbar-left">{left}</div>
    {title ? <h1 className="appbar-title">{title}</h1> : <span />}
    <div className="appbar-right">{children}</div>
  </header>
);

export const Footer = () => {
  const { t } = useSettings();
  return (
    <footer className="footer">
      <span>{t('createdBy')}</span>
      <span>©{new Date().getFullYear()}</span>
    </footer>
  );
};
