import { useEffect } from 'react';
import { useSettings } from '../lib/settings';
import { IconButton } from './Chrome';

// variant="bare" = bez karty i bez przycisku zamknięcia (np. otwarte okienko w widoku odbiorcy)
const Modal = ({ title, onClose, children, variant = 'card' }) => {
  const { t } = useSettings();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const bare = variant === 'bare';
  return (
    <div className="dlg-overlay" onClick={onClose}>
      <div
        className={`dlg${bare ? ' dlg-bare' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
      >
        {!bare && (
          <div className="dlg-head">
            {title && <h2>{title}</h2>}
            <IconButton icon="x" label={t('close')} onClick={onClose} />
          </div>
        )}
        {children}
      </div>
    </div>
  );
};

export default Modal;
