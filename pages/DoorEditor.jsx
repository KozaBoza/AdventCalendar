import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// --- 1. IMPORTY TŁA ---
import bg1 from '../assets/bg-1.png';
import bg2 from '../assets/bg-2.png';
import bg3 from '../assets/bg-3.png';
import bg4 from '../assets/bg-4.png';

// --- 2. IMPORTY STICKERS ---
import s1 from '../assets/stickers/s-1.png';
import s16 from '../assets/stickers/s-16.png';
import s3 from '../assets/stickers/s-3.png';
import s17 from '../assets/stickers/s-17.png';
import s5 from '../assets/stickers/s-5.png';
import s6 from '../assets/stickers/s-6.png';
import s7 from '../assets/stickers/s-7.png';
import s8 from '../assets/stickers/s-8.png';
import s9 from '../assets/stickers/s-9.png';
import s18 from '../assets/stickers/s-18.png';
import s11 from '../assets/stickers/s-11.png';
import s12 from '../assets/stickers/s-12.png';
import s13 from '../assets/stickers/s-13.png';
import s14 from '../assets/stickers/s-14.png';
import s15 from '../assets/stickers/s-15.png';
import s19 from '../assets/stickers/s-19.png';

// --- 3. IMPORTY TREATS ---
import f1 from '../assets/treats/f-1.png';
import f2 from '../assets/treats/f-2.png';
import f3 from '../assets/treats/f-3.png';
import f4 from '../assets/treats/f-4.png';
import f5 from '../assets/treats/f-5.png';
import f6 from '../assets/treats/f-6.png';
import f7 from '../assets/treats/f-7.png';
import f8 from '../assets/treats/f-8.png';
import f9 from '../assets/treats/f-9.png';
import f10 from '../assets/treats/f-10.png';
import f11 from '../assets/treats/f-11.png';
import f12 from '../assets/treats/f-12.png';


const FONTS = ['Work Sans', 'Space Mono', 'Silkscreen', 'Barrio', 'Pinyon Script', 'vt323'];

const ASSETS = {
  backgrounds: [bg1, bg2, bg3, bg4],
  stickers: [s1, s16, s3, s17, s5, s6, s7, s8, s9, s18, s11, s12, s13, s14, s15, s19],
  treats: [f1, f2, f3, f4, f5, f6, f7, f8, f9, f10, f11, f12]
};

// --- POMOCNICZA FUNKCJA DO POBIERANIA POZYCJI (MYSZ LUB DOTYK) ---
const getClientPos = (e) => {
    if (e.touches && e.touches.length > 0) {
        return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
};

const DoorEditor = () => {
  const { id, day } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const dayIndex = parseInt(day) - 1;

  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  
  const [loading, setLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState('bg');
  
  const [background, setBackground] = useState(null);
  const [elements, setElements] = useState([]);
  
  const [selectedId, setSelectedId] = useState(null);
  const [isEditingText, setIsEditingText] = useState(false); 

  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkForm, setLinkForm] = useState({ url: '', text: '' });
  const [editingLinkId, setEditingLinkId] = useState(null);
  const [dragState, setDragState] = useState(null); 

  useEffect(() => {
    const fetchData = async () => {
      const docRef = doc(db, "calendars", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data.editToken !== token) { navigate('/'); return; }
        const dayData = data.days[dayIndex];
        if (typeof dayData === 'object' && dayData.type === 'canvas') {
            setBackground(dayData.background);
            setElements(dayData.elements || []);
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [id, dayIndex, token, navigate]);

  useEffect(() => {
    const handleWindowMove = (e) => {
      if (!dragState) return;
      
      // Zapobiega przewijaniu strony podczas przesuwania elementu na telefonie
      if(e.type === 'touchmove') {
       } else {
          e.preventDefault();
      }

      const { mode, startX, startY, startElem } = dragState;
      const { x: clientX, y: clientY } = getClientPos(e); // Używamy helpera

      const deltaX = clientX - startX;
      const deltaY = clientY - startY;

      setElements(prev => prev.map(el => {
        if (el.id !== startElem.id) return el;

        if (mode === 'move') {
          const containerWidth = containerRef.current.offsetWidth;
          const containerHeight = containerRef.current.offsetHeight;
          return {
            ...el,
            x: startElem.x + (deltaX / containerWidth) * 100,
            y: startElem.y + (deltaY / containerHeight) * 100
          };
        }

        if (mode === 'resize') {
           const delta = Math.max(deltaX, deltaY); 
           if (el.type === 'text' || el.type === 'button') {
               const newSize = Math.max(10, startElem.fontSize + delta * 0.5);
               return { ...el, fontSize: newSize };
           } else {
               const newWidth = Math.max(20, startElem.width + delta);
               return { ...el, width: newWidth };
           }
        }

        if (mode === 'rotate') {
           return { ...el, rotation: (startElem.rotation || 0) + (deltaX * 0.8) };
        }

        return el;
      }));
    };

    const handleWindowUp = () => {
      setDragState(null);
    };

    if (dragState) {
      // Mouse events
      window.addEventListener('mousemove', handleWindowMove);
      window.addEventListener('mouseup', handleWindowUp);
      window.addEventListener('touchmove', handleWindowMove, { passive: false });
      window.addEventListener('touchend', handleWindowUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleWindowMove);
      window.removeEventListener('mouseup', handleWindowUp);
      window.removeEventListener('touchmove', handleWindowMove);
      window.removeEventListener('touchend', handleWindowUp);
    };
  }, [dragState]);

  const startAction = (e, mode, elem) => {
   e.stopPropagation(); 
    if (isEditingText && mode === 'move') return;

    const { x, y } = getClientPos(e);

    setDragState({
      mode,
      startX: x,
      startY: y,
      startElem: { ...elem } 
    });
    setSelectedId(elem.id);
  };

  const addElement = (config) => {
    const newEl = {
        id: Date.now(), x: 50, y: 50, rotation: 0, 
        width: 150, fontSize: 24, 
        ...config
    };
    setElements([...elements, newEl]);
    setSelectedId(newEl.id);
  };

  const addText = () => addElement({
    type: 'text', content: 'Double click', 
    fontFamily: 'Work Sans', color: '#000000', 
    bold: false, italic: false 
  });

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => addElement({ type: 'image', src: reader.result, width: 200 });
        reader.readAsDataURL(file);
    }
    e.target.value = null; 
  };

  const openLinkModal = (existingEl = null) => {
    if (existingEl) {
        setEditingLinkId(existingEl.id);
        setLinkForm({ url: existingEl.url, text: existingEl.content });
    } else {
        setEditingLinkId(null);
        setLinkForm({ url: '', text: 'Click here' });
    }
    setShowLinkModal(true);
  };

  const confirmAddLink = () => {
    if (editingLinkId) {
        setElements(prev => prev.map(el => el.id === editingLinkId ? {
            ...el, url: linkForm.url, content: linkForm.text
        } : el));
    } else {
        addElement({
            type: 'button', url: linkForm.url, content: linkForm.text, 
            fontSize: 16, color: '#000000',
        });
    }
    setShowLinkModal(false);
    setEditingLinkId(null);
  };

  const deleteElement = (id) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedId(null);
    setIsEditingText(false);
  };

  const updateElement = (id, key, value) => {
    setElements(prev => prev.map(el => el.id === id ? { ...el, [key]: value } : el));
  };

  const bringToFront = (id) => {
    setElements(prev => {
        const index = prev.findIndex(el => el.id === id);
        if (index === -1 || index === prev.length - 1) return prev;
        const newArr = [...prev];
        const [item] = newArr.splice(index, 1);
        newArr.push(item); 
        return newArr;
    });
  };

  const sendToBack = (id) => {
    setElements(prev => {
        const index = prev.findIndex(el => el.id === id);
        if (index === -1 || index === 0) return prev;
        const newArr = [...prev];
        const [item] = newArr.splice(index, 1);
        newArr.unshift(item); 
        return newArr;
    });
  };

  const handleSave = async () => {
    setLoading(true);
    const docRef = doc(db, "calendars", id);
    const snap = await getDoc(docRef);
    const currentDays = snap.data().days;
    currentDays[dayIndex] = { type: 'canvas', background, elements };
    await updateDoc(docRef, { days: currentDays });
    setLoading(false);
    navigate(`/edit/${id}?token=${token}`);
  };

  if (loading) return <div className="page-container">loading...</div>;

  return (
    <div className="page-container" style={{maxWidth: '1000px'}}>

      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
         <div style={{display: 'flex', gap: '15px'}}>
            <button className="btn-outline" onClick={addText}>text</button>
            <button className="btn-outline" onClick={() => fileInputRef.current.click()}>image</button>
            <button className="btn-outline" onClick={() => openLinkModal(null)}>link</button>
         </div>
         <div style={{display: 'flex', gap: '10px'}}>
             <button className="btn-outline" onClick={() => navigate(`/edit/${id}?token=${token}`)}>cancel</button>
             <button className="btn-black" style={{width: 'auto', margin: 0}} onClick={handleSave}>save</button>
         </div>
      </header>

      <input 
        type="file" 
        ref={fileInputRef} 
        style={{ display: 'none' }} 
        onChange={handleImageUpload} 
        accept="image/*"
      />

      <div className="editor-layout">
        
        <div className="editor-sidebar" style={{width: '300px', flex: 'none'}}>
           <div className="editor-tabs">
              <div className={`editor-tab ${activeTab==='bg'?'active':''}`} onClick={()=>setActiveTab('bg')}>background</div>
              <div className={`editor-tab ${activeTab==='stickers'?'active':''}`} onClick={()=>setActiveTab('stickers')}>stickers</div>
              <div className={`editor-tab ${activeTab==='treats'?'active':''}`} onClick={()=>setActiveTab('treats')}>treats</div>
           </div>
           
           <div className="editor-tools-content">
              <div className="assets-grid">
                  {/* TŁA */}
                  {activeTab === 'bg' && ASSETS.backgrounds.map((bg, i) => (
                        <div key={i} className="asset-item" onClick={() => setBackground(bg)}>
                           <img src={bg} alt="bg" />
                        </div>
                  ))}

                  {/* NAKLEJKI */}
                  {activeTab === 'stickers' && ASSETS.stickers.map((s, i) => (
                     <div key={i} className="asset-item" onClick={()=>addElement({type: 'sticker', src: s, width: 80})}>
                        <img src={s} alt="s" />
                     </div>
                  ))}

                  {activeTab === 'treats' && ASSETS.treats.map((t, i) => (
                     <div key={i} className="asset-item" onClick={()=>addElement({type: 'sticker', src: t, width: 80})}>
                        <img src={t} alt="treat" />
                     </div>
                  ))}
              </div>
           </div>
        </div>

        <div className="editor-canvas-area" onMouseDown={() => { setSelectedId(null); setIsEditingText(false); }} onTouchStart={() => { setSelectedId(null); setIsEditingText(false); }}>
           <div 
              ref={containerRef}
              className="canvas-preview" 
              style={{
                width: '400px', height: '400px', 
                backgroundImage: background ? `url(${background})` : 'none',
                backgroundSize: 'cover',
                position: 'relative', overflow: 'hidden',
                boxShadow: '0 0 20px rgba(0,0,0,0.1)',
                touchAction: 'none' 
           }}>
           {elements.map((el, index) => (
                 <div 
                    key={el.id}
                    className="canvas-element"
                    onMouseDown={(e) => startAction(e, 'move', el)}
                    onTouchStart={(e) => startAction(e, 'move', el)}
                    
                    onDoubleClick={(e) => {
                        e.stopPropagation();
                        if (el.type === 'text') { setIsEditingText(true); setSelectedId(el.id); }
                        if (el.type === 'button') { openLinkModal(el); }
                    }}
                    style={{ 
                        left: `${el.x}%`, top: `${el.y}%`,
                        transform: `translate(-50%, -50%) rotate(${el.rotation}deg)`,
                        zIndex: index, 
                        cursor: isEditingText && selectedId === el.id ? 'text' : 'move',
                        width: el.type === 'text' ? 'auto' : `${el.width}px`
                    }}
                 >
                    {/* ZAWARTOŚĆ */}
                    {el.type === 'text' && (
                       <div
                          contentEditable={isEditingText && selectedId === el.id}
                          suppressContentEditableWarning
                          onBlur={(e) => updateElement(el.id, 'content', e.target.innerText)}
                          style={{
                              fontFamily: el.fontFamily,
                              fontSize: `${el.fontSize}px`,
                              fontWeight: el.bold ? 'bold' : 'normal',
                              fontStyle: el.italic ? 'italic' : 'normal',
                              color: el.color,
                              minWidth: '20px', textAlign: 'center',
                              outline: 'none', 
                              border: isEditingText && selectedId === el.id ? '1px dashed #ccc' : 'none',
                              whiteSpace: 'nowrap',
                              userSelect: 'none'
                          }}
                          onMouseDown={e => { if(isEditingText) e.stopPropagation(); }} 
                          onTouchStart={e => { if(isEditingText) e.stopPropagation(); }} 
                       >
                          {el.content}
                       </div>
                    )}

                    {(el.type === 'image' || el.type === 'sticker') && (
                       <img src={el.src} style={{ width: '100%', pointerEvents: 'none', display: 'block' }} alt="el" />
                    )}

                    {el.type === 'button' && (
                        <button className="btn-black" style={{ pointerEvents: 'none', fontSize: `${el.fontSize}px`, padding: '10px 20px', width: 'auto', whiteSpace: 'nowrap' }}>
                            {el.content} 
                        </button>
                    )}

                    {selectedId === el.id && !isEditingText && (
                        <>
                            <div style={{
                                position: 'absolute', top: -4, left: -4, right: -4, bottom: -4,
                                border: '2px dashed #7e8082ff', pointerEvents: 'none'
                            }} />
                            
                            <div 
                                onMouseDown={(e) => startAction(e, 'rotate', el)} 
                                onTouchStart={(e) => startAction(e, 'rotate', el)}
                                style={{
                                    position: 'absolute', top: -30, left: '50%', transform: 'translateX(-50%)',
                                    width: 24, height: 24, borderRadius: '50%', backgroundColor: '#5d6164ff', 
                                    cursor: 'grab', zIndex: 20
                                }}
                            >
                                <div style={{position:'absolute', top:24, left:11, width:2, height:6, background:'#707376ff'}}></div>
                            </div>
                            
                            <div 
                                onMouseDown={(e) => startAction(e, 'resize', el)} 
                                onTouchStart={(e) => startAction(e, 'resize', el)}
                                style={{
                                    position: 'absolute', bottom: -12, right: -12,
                                    width: 24, height: 24, borderRadius: '50%', backgroundColor: 'white', 
                                    border: '2px solid #7e8082ff', cursor: 'nwse-resize', zIndex: 20
                                }}
                            />
                            
                            <div 
                                className="element-toolbar" 
                                style={{ top: '-100px' }} 
                                onMouseDown={e => e.stopPropagation()}
                                onTouchStart={e => e.stopPropagation()}
                            >
                               
                                <button className="format-btn" onClick={() => sendToBack(el.id)} title="Send to Back">down</button>
                                <div style={{width: 2, height: 30, background: '#131313ff', margin: '0px'}}></div>

                                <button className="format-btn" onClick={() => bringToFront(el.id)} title="Bring to Front">up</button>
                                <div style={{width: 2, height: 30, background: '#131313ff', margin: '0px'}}></div>

                                {el.type === 'text' && (
                                    <>
                                        <select className="font-select" style={{borderwidth:'1px',width:'80px'}} value={el.fontFamily} onChange={(e)=>updateElement(el.id, 'fontFamily', e.target.value)}>
                                            {FONTS.map(f=><option key={f} value={f}>{f}</option>)}
                                        </select>
                                        <button className={`format-btn ${el.bold?'active':''}`} onClick={()=>updateElement(el.id, 'bold', !el.bold)}>B</button>
                                        <button className={`format-btn ${el.italic?'active':''}`} onClick={()=>updateElement(el.id, 'italic', !el.italic)} style={{fontStyle: 'italic'}}>I</button>
                                        <input type="color" value={el.color} onChange={e=>updateElement(el.id, 'color', e.target.value)} style={{width:'30px', border:'none', padding:0}} />
                                    </>
                                )}
                                {el.type === 'button' && (
                                    <button className="format-btn" onClick={() => openLinkModal(el)}>edit</button>
                                )}
                                <button className="format-btn delete" onClick={()=>deleteElement(el.id)}>del</button>
                            </div>
                        </>
                    )}
                 </div>
              ))}
           </div>
        </div>
      </div>

      {showLinkModal && (
         <div className="modal-overlay">
            <div className="theme-modal">
               <h3>{editingLinkId ? 'Edit Link' : 'Add Link'}</h3>
               <label>url</label>
               <input type="text" value={linkForm.url} onChange={e => setLinkForm({...linkForm, url: e.target.value})} placeholder="https://..." />
               <label>label</label>
               <input type="text" maxLength={18} value={linkForm.text} onChange={e => setLinkForm({...linkForm, text: e.target.value})} />
               <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px'}}>
                  <button className="btn-outline"  onClick={() => setShowLinkModal(false)}>cancel</button>
                  <button className="btn-black" style={{width: 'auto'}} onClick={confirmAddLink}>{editingLinkId ? 'Update' : 'Add'}</button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default DoorEditor;