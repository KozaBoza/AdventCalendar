import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../lib/settings';
import '../styles/dayContent.css';

// Logiczny rozmiar płótna z edytora. Zawartość jest skalowana do dowolnego kontenera,
// więc okienko wygląda tak samo w kafelku, w modalu i w edytorze.
export const CANVAS_SIZE = 400;

// blokuje javascript:/data: itd. w linkach wpisanych przez użytkownika
export const safeUrl = (raw = '') => {
  const s = String(raw).trim();
  if (!s) return '#';
  if (/^(javascript|data|vbscript|file):/i.test(s)) return '#';
  if (/^(https?:|mailto:)/i.test(s)) return s;
  return `https://${s}`;
};

const DayContent = ({ content }) => {
  const { t } = useSettings();
  const ref = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / CANVAS_SIZE));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isCanvas = content && typeof content === 'object' && content.type === 'canvas';

  return (
    <div className="day-content" ref={ref}>
      {isCanvas ? (
        <div
          className="day-canvas"
          style={{
            width: CANVAS_SIZE,
            height: CANVAS_SIZE,
            transform: `scale(${scale})`,
            backgroundImage: content.background ? `url("${content.background}")` : 'none',
          }}
        >
          {(content.elements || []).map((el) => (
            <div
              key={el.id}
              className="canvas-el"
              style={{
                left: `${el.x}%`,
                top: `${el.y}%`,
                transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                width: el.type === 'text' ? 'auto' : `${el.width}px`,
              }}
            >
              {(el.type === 'image' || el.type === 'sticker') && <img src={el.src} alt="" draggable="false" />}
              {el.type === 'text' && (
                <div
                  className="canvas-text"
                  style={{
                    fontFamily: el.fontFamily,
                    fontSize: `${el.fontSize}px`,
                    fontWeight: el.bold ? 600 : 300,
                    fontStyle: el.italic ? 'italic' : 'normal',
                    color: el.color,
                  }}
                >
                  {el.content}
                </div>
              )}
              {el.type === 'button' && (
                <a
                  className="canvas-btn"
                  href={safeUrl(el.url)}
                  target="_blank"
                  rel="noreferrer noopener"
                  style={{ fontSize: `${el.fontSize}px` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {el.content}
                </a>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="day-text">{typeof content === 'string' && content ? content : t('emptyDoor')}</div>
      )}
    </div>
  );
};

export default DayContent;
