// src/pages/DoorEditor.jsx – edytor jednego okienka (/edit/:id/door/:day?token=...)
import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useSettings } from '../lib/settings';
import { ASSETS, CANVAS_FONTS } from '../lib/assets';
import { shake } from '../lib/ui';
import { IconButton, Toggles } from '../components/Chrome';
import Field from '../components/Field';
import Icon from '../components/Icons';
import Modal from '../components/Modal';
import Slider from '../components/Slider';
import { CANVAS_SIZE, safeUrl } from '../components/DayContent';
import '../styles/dayContent.css';
import '../styles/editor.css';

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

// zmniejsza wgrywane zdjęcia, żeby dokument w Firestore nie przekroczył limitu 1 MB
async function toDataUrl(file, max = 700) {
  const bmp = await createImageBitmap(file);
  const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/webp', 0.85);
}

const isTextual = (el) => el.type === 'text' || el.type === 'button';

// obrót może urosnąć poza ±180° (przeciąganie uchwytem) – suwak pokazuje wartość zawiniętą do -180…180
const normalizeAngle = (deg = 0) => Math.round((((deg + 180) % 360) + 360) % 360 - 180);

const DoorEditor = () => {
  const { id, day } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, notify } = useSettings();
  const token = searchParams.get('token');
  const dayNumber = parseInt(day, 10);
  const dayIndex = dayNumber - 1;
  const backTo = `/edit/${id}?token=${token}`;

  const fileInputRef = useRef(null);
  const stageRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dayTitle, setDayTitle] = useState('');
  const [tab, setTab] = useState('bg');
  const [scale, setScale] = useState(1);

  // ---- stan sceny + historia (cofnij/ponów) ----
  const [scene, setScene] = useState({ background: null, elements: [] });
  const sceneRef = useRef(scene);
  sceneRef.current = scene;
  const past = useRef([]);
  const future = useRef([]);
  const [, bump] = useState(0);

  const pushHistory = useCallback(() => {
    past.current.push(sceneRef.current);
    if (past.current.length > 60) past.current.shift();
    future.current = [];
    bump((n) => n + 1);
  }, []);

  const commit = (fn) => { pushHistory(); setScene(fn); };
  const live = (fn) => setScene(fn);

  const [selectedId, setSelectedId] = useState(null);
  const [editingText, setEditingText] = useState(false);
  const [drag, setDrag] = useState(null);
  const moved = useRef(false);

  const [linkModal, setLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({ url: '', text: '' });
  const [linkErrors, setLinkErrors] = useState({});
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [loadError, setLoadError] = useState(false);
  const linkUrlRef = useRef(null);
  const linkLabelRef = useRef(null);

  const undo = () => {
    if (!past.current.length) return;
    future.current.push(sceneRef.current);
    setScene(past.current.pop());
    setSelectedId(null);
    bump((n) => n + 1);
  };
  const redo = () => {
    if (!future.current.length) return;
    past.current.push(sceneRef.current);
    setScene(future.current.pop());
    setSelectedId(null);
    bump((n) => n + 1);
  };

  const patchEl = (elId, patch) => (s) => ({
    ...s,
    elements: s.elements.map((el) => (el.id === elId ? { ...el, ...(typeof patch === 'function' ? patch(el) : patch) } : el)),
  });

  // ---- wczytanie ----
  useEffect(() => {
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'calendars', id));
        if (snap.exists()) {
          const data = snap.data();
          if (data.editToken !== token) { navigate('/'); return; }
          const d = data.days[dayIndex];
          if (d && typeof d === 'object' && d.type === 'canvas') {
            setScene({ background: d.background || null, elements: d.elements || [] });
            setDayTitle(d.title || '');
          }
        }
      } catch (error) {
        console.error('Error loading day:', error);
        setLoadError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, dayIndex, token, navigate]);

  // ---- skala płótna (dopasowanie do szerokości) ----
  useEffect(() => {
    const el = stageRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      setScale(Math.min(1.4, Math.max(0.5, entry.contentRect.width / CANVAS_SIZE)));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]);

  // ---- przeciąganie / skalowanie / obrót (pointer events: mysz + dotyk) ----
  useEffect(() => {
    if (!drag) return undefined;

    const move = (e) => {
      const dx = (e.clientX - drag.startX) / scale;
      const dy = (e.clientY - drag.startY) / scale;
      if (!moved.current) {
        if (Math.abs(dx) + Math.abs(dy) < 2) return;
        pushHistory();
        moved.current = true;
      }
      const s = drag.startElem;
      let patch;
      if (drag.mode === 'move') {
        patch = { x: s.x + (dx / CANVAS_SIZE) * 100, y: s.y + (dy / CANVAS_SIZE) * 100 };
      } else if (drag.mode === 'resize') {
        const d = Math.max(dx, dy);
        patch = isTextual(s)
          ? { fontSize: Math.max(10, s.fontSize + d * 0.5) }
          : { width: Math.max(20, s.width + d) };
      } else {
        patch = { rotation: (s.rotation || 0) + dx * 0.8 };
      }
      live(patchEl(s.id, patch));
    };
    const up = () => setDrag(null);

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [drag, scale, pushHistory]);

  const startAction = (e, mode, el) => {
    e.stopPropagation();
    if (editingText && mode === 'move') return;
    moved.current = false;
    setDrag({ mode, startX: e.clientX, startY: e.clientY, startElem: { ...el } });
    setSelectedId(el.id);
  };

  // ---- elementy ----
  const addElement = (config) => {
    const el = { id: newId(), x: 50, y: 50, rotation: 0, width: 150, fontSize: 24, ...config };
    commit((s) => ({ ...s, elements: [...s.elements, el] }));
    setSelectedId(el.id);
  };

  const addText = () => addElement({
    type: 'text', content: t('dblClickText'), fontFamily: 'Inter', color: '#000000', bold: false, italic: false,
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = null;
    if (!file) return;
    try { addElement({ type: 'image', src: await toDataUrl(file), width: 200 }); } catch (err) { console.error(err); }
  };

  const openLinkModal = (el = null) => {
    if (el) { setEditingLinkId(el.id); setLinkForm({ url: el.url, text: el.content }); }
    else { setEditingLinkId(null); setLinkForm({ url: '', text: t('clickHere') }); }
    setLinkErrors({});
    setLinkModal(true);
  };

  const confirmLink = () => {
    const rawUrl = linkForm.url.trim();
    const label = linkForm.text.trim();
    const errs = {};
    if (!rawUrl) errs.url = t('errUrl');
    if (!label) errs.text = t('errLabel');
    if (errs.url || errs.text) {
      setLinkErrors(errs);
      const target = errs.url ? linkUrlRef.current : linkLabelRef.current;
      target?.focus();
      shake(target);
      return;
    }
    const url = safeUrl(rawUrl);
    if (editingLinkId) commit(patchEl(editingLinkId, { url, content: label }));
    else addElement({ type: 'button', url, content: label, fontSize: 16 });
    setLinkModal(false);
    setEditingLinkId(null);
  };

  const deleteElement = (elId) => {
    commit((s) => ({ ...s, elements: s.elements.filter((el) => el.id !== elId) }));
    setSelectedId(null);
    setEditingText(false);
  };

  const reorder = (elId, toFront) => commit((s) => {
    const i = s.elements.findIndex((el) => el.id === elId);
    if (i === -1) return s;
    const arr = [...s.elements];
    const [item] = arr.splice(i, 1);
    if (toFront) arr.push(item); else arr.unshift(item);
    return { ...s, elements: arr };
  });

  // ---- zapis ----
  const handleSave = async () => {
    setSaving(true);
    try {
      const ref = doc(db, 'calendars', id);
      const snap = await getDoc(ref);
      const days = [...snap.data().days];
      days[dayIndex] = { type: 'canvas', title: dayTitle, background: scene.background, elements: scene.elements };
      await updateDoc(ref, { days });
      navigate(backTo);
    } catch (err) {
      console.error(err);
      notify(t('errSave'));
      setSaving(false);
    }
  };

  if (loading) return <div className="center-msg">{t('loading')}</div>;
  if (loadError) return <div className="center-msg">{t('errLoad')}</div>;

  const selected = scene.elements.find((el) => el.id === selectedId);
  const assetList = tab === 'bg' ? ASSETS.bg : tab === 'stickers' ? ASSETS.stickers : ASSETS.treats;
  const tabTitle = tab === 'bg' ? t('toolBackground') : tab === 'stickers' ? t('toolStickers') : t('toolTreats');

  return (
    <div className="editor">
      <header className="editor-bar">
        <IconButton icon="arrowLeft" label={t('cancel')} onClick={() => navigate(backTo)} />
        <IconButton icon="undo" label={t('undo')} disabled={!past.current.length} onClick={undo} />
        <IconButton icon="redo" label={t('redo')} disabled={!future.current.length} onClick={redo} />
        <div className="editor-title">
          <span>{t('dayPrefix', { n: dayNumber })}</span>
          <input
            value={dayTitle}
            placeholder={t('dayTitlePh')}
            aria-label={t('dayTitlePh')}
            maxLength={40}
            onChange={(e) => setDayTitle(e.target.value)}
          />
        </div>
        <span className="grow" />
        <Toggles />
        <IconButton solid icon="arrowRight" label={saving ? t('saving') : t('save')} disabled={saving} onClick={handleSave} />
      </header>

      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />

      <div className="editor-body">
        {/* narzędzia */}
        <nav className="editor-tools" aria-label="tools">
          <IconButton large icon="layers" label={t('toolBackground')} active={tab === 'bg'} onClick={() => setTab('bg')} />
          <IconButton large icon="smile" label={t('toolStickers')} active={tab === 'stickers'} onClick={() => setTab('stickers')} />
          <IconButton large icon="gift" label={t('toolTreats')} active={tab === 'treats'} onClick={() => setTab('treats')} />
          <IconButton large icon="type" label={t('toolText')} onClick={addText} />
          <IconButton large icon="image" label={t('toolImage')} onClick={() => fileInputRef.current?.click()} />
          <IconButton large icon="link" label={t('toolLink')} onClick={() => openLinkModal(null)} />
        </nav>

        {/* płótno */}
        <div
          className="editor-stage"
          ref={stageRef}
          onPointerDown={() => { setSelectedId(null); setEditingText(false); }}
        >
          <div className="stage-fit" style={{ width: CANVAS_SIZE * scale, height: CANVAS_SIZE * scale }}>
            <div
              className="canvas"
              style={{
                width: CANVAS_SIZE,
                height: CANVAS_SIZE,
                transform: `scale(${scale})`,
                backgroundImage: scene.background ? `url("${scene.background}")` : 'none',
                '--inv': 1 / scale,   // uchwyty i ramka zaznaczenia mają stały rozmiar na ekranie niezależnie od skali płótna
              }}
            >
              {scene.elements.map((el, index) => {
                const isSel = selectedId === el.id;
                const editing = editingText && isSel;
                return (
                  <div
                    key={el.id}
                    className="canvas-el"
                    onPointerDown={(e) => startAction(e, 'move', el)}
                    onDoubleClick={(e) => {
                      e.stopPropagation();
                      if (el.type === 'text') { setEditingText(true); setSelectedId(el.id); }
                      if (el.type === 'button') openLinkModal(el);
                    }}
                    style={{
                      left: `${el.x}%`,
                      top: `${el.y}%`,
                      transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                      zIndex: index,
                      cursor: editing ? 'text' : 'move',
                      width: el.type === 'text' ? 'auto' : `${el.width}px`,
                    }}
                  >
                    {el.type === 'text' && (
                      <div
                        className="canvas-text"
                        contentEditable={editing}
                        suppressContentEditableWarning
                        onPointerDown={(e) => { if (editing) e.stopPropagation(); }}
                        onBlur={(e) => {
                          const next = e.currentTarget.innerText;
                          if (next !== el.content) commit(patchEl(el.id, { content: next }));
                          setEditingText(false);
                        }}
                        style={{
                          fontFamily: el.fontFamily,
                          fontSize: `${el.fontSize}px`,
                          fontWeight: el.bold ? 600 : 300,
                          fontStyle: el.italic ? 'italic' : 'normal',
                          color: el.color,
                          outline: 'none',
                          border: editing ? '1px dashed #999' : '1px solid transparent',
                          userSelect: editing ? 'text' : 'none',
                        }}
                      >
                        {el.content}
                      </div>
                    )}
                    {(el.type === 'image' || el.type === 'sticker') && <img src={el.src} alt="" draggable="false" />}
                    {el.type === 'button' && (
                      <span className="canvas-btn" style={{ fontSize: `${el.fontSize}px`, pointerEvents: 'none' }}>{el.content}</span>
                    )}

                    {isSel && !editing && (
                      <>
                        <div className="sel-frame" />
                        <div className="sel-stem" />
                        <div
                          className="handle rotate"
                          title={t('rotation')}
                          onPointerDown={(e) => startAction(e, 'rotate', el)}
                        >
                          <Icon name="rotate" />
                        </div>
                        <div
                          className="handle resize"
                          title={t('size')}
                          onPointerDown={(e) => startAction(e, 'resize', el)}
                        >
                          <Icon name="resize" />
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* panele boczne */}
        <aside className="editor-side">
          <section className="panel">
            <h3>{tabTitle}</h3>
            <div className="assets-grid">
              {tab === 'bg' && (
                <button type="button" className="asset-item" onClick={() => commit((s) => ({ ...s, background: null }))} title={t('noBackground')}>
                  ×
                </button>
              )}
              {assetList.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  className="asset-item"
                  onClick={() => (tab === 'bg'
                    ? commit((s) => ({ ...s, background: src }))
                    : addElement({ type: 'sticker', src, width: 80 }))}
                >
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          </section>

          <section className="panel inspector">
            {!selected && <p className="hint">{t('selectHint')}</p>}
            {selected && (
              <>
                <Slider
                  label={t('size')}
                  min={isTextual(selected) ? 10 : 20}
                  max={isTextual(selected) ? 96 : 400}
                  value={Math.round(isTextual(selected) ? selected.fontSize : selected.width)}
                  format={(v) => (isTextual(selected) ? `${v} px` : `${v}`)}
                  onPointerDown={pushHistory}
                  onChange={(v) => live(patchEl(selected.id, isTextual(selected) ? { fontSize: v } : { width: v }))}
                />
                <Slider
                  label={t('rotation')}
                  min={-180}
                  max={180}
                  value={normalizeAngle(selected.rotation)}
                  format={(v) => `${v}°`}
                  onPointerDown={pushHistory}
                  onChange={(v) => live(patchEl(selected.id, { rotation: v }))}
                />

                {selected.type === 'text' && (
                  <div className="row">
                    <label>{t('font')}</label>
                    <div className="btn-row">
                      <select
                        value={selected.fontFamily}
                        onChange={(e) => commit(patchEl(selected.id, { fontFamily: e.target.value }))}
                      >
                        {CANVAS_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <IconButton active={selected.bold} label="B" onClick={() => commit(patchEl(selected.id, { bold: !selected.bold }))}>B</IconButton>
                      <IconButton active={selected.italic} label="I" onClick={() => commit(patchEl(selected.id, { italic: !selected.italic }))}>I</IconButton>
                      <input
                        type="color"
                        value={selected.color}
                        aria-label="color"
                        onChange={(e) => live(patchEl(selected.id, { color: e.target.value }))}
                        onPointerDown={pushHistory}
                      />
                    </div>
                  </div>
                )}

                <div className="btn-row">
                  <IconButton icon="up" label={t('toFront')} onClick={() => reorder(selected.id, true)} />
                  <IconButton icon="down" label={t('toBack')} onClick={() => reorder(selected.id, false)} />
                  {selected.type === 'text' && (
                    <IconButton icon="pencil" label={t('edit')} onClick={() => setEditingText(true)} />
                  )}
                  {selected.type === 'button' && (
                    <IconButton icon="pencil" label={t('edit')} onClick={() => openLinkModal(selected)} />
                  )}
                  <IconButton icon="trash" label={t('delete')} onClick={() => deleteElement(selected.id)} />
                </div>
              </>
            )}
          </section>
        </aside>
      </div>

      {linkModal && (
        <Modal title={editingLinkId ? t('editLink') : t('addLink')} onClose={() => setLinkModal(false)}>
          <Field id="l-url" label={t('url')} required error={linkErrors.url}>
            {(p) => (
              <input
                {...p}
                ref={linkUrlRef}
                type="text"
                value={linkForm.url}
                placeholder="https://..."
                onChange={(e) => { setLinkForm({ ...linkForm, url: e.target.value }); setLinkErrors((x) => ({ ...x, url: undefined })); }}
              />
            )}
          </Field>
          <Field id="l-label" label={t('label')} required error={linkErrors.text}>
            {(p) => (
              <input
                {...p}
                ref={linkLabelRef}
                type="text"
                maxLength={18}
                value={linkForm.text}
                onChange={(e) => { setLinkForm({ ...linkForm, text: e.target.value }); setLinkErrors((x) => ({ ...x, text: undefined })); }}
              />
            )}
          </Field>
          <div className="dlg-actions">
            <button type="button" className="btn" onClick={() => setLinkModal(false)}>{t('cancel')}</button>
            <button type="button" className="btn is-solid" onClick={confirmLink}>{editingLinkId ? t('update') : t('add')}</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default DoorEditor;
