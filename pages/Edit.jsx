// src/pages/Edit.jsx
import { useEffect, useState } from 'react';
import { useParams, Link, useSearchParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

// 1. IMPORT ZASOBÓW
const doorImages = import.meta.glob('../assets/doors/*.png', { eager: true, import: 'default' });

const Edit = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [calendarData, setCalendarData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // STANY MODALI
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false); // NOWY STAN
  
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const urlToken = searchParams.get('token');
  const publicLink = `${window.location.origin}/c/${id}`;
  const editLink = `${window.location.origin}/edit/${id}?token=${urlToken}`;

  // TWOJE USTAWIENIA MOTYWÓW
  const themes = ['classic', 'elegant', 'gifts'];
  
  const themePrefixes = {
    'classic': 'b',
    'elegant': 'c',
    'gifts': 'a',
  };

  useEffect(() => {
    const fetchCalendar = async () => {
      const docRef = doc(db, "calendars", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.editToken && data.editToken !== urlToken) {
           alert("Brak dostępu! Potrzebujesz linku z tokenem, aby edytować.");
           navigate(`/c/${id}`);
           return;
        }
        setCalendarData(data);
      } else {
        alert("Nie znaleziono kalendarza!");
      }
      setLoading(false);
    };
    fetchCalendar();
  }, [id, urlToken, navigate]);

  const handleThemeChange = async (newTheme) => {
    setCalendarData({ ...calendarData, theme: newTheme });
    const docRef = doc(db, "calendars", id);
    await updateDoc(docRef, { theme: newTheme });
    setShowThemeModal(false);
  };

  // 2. KULOODPORNE WYSZUKIWANIE OBRAZKA
  const getDoorDetails = (theme, day) => {
    const prefix = themePrefixes[theme] || 'a';
    const fileName = `${prefix}${day}.png`; 

    const foundKey = Object.keys(doorImages).find(key => {
        const keyFileName = key.split('/').pop();
        return keyFileName === fileName;
    });

    return { 
      src: foundKey ? doorImages[foundKey] : null, 
      fileName 
    }; 
  };

  // Obsługa kopiowania w modalu Share
  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicLink);
    alert("Link copied to clipboard!");
  };

  if (loading) return <div className="page-container">Loading...</div>;
  if (!calendarData) return null;

  const currentTheme = calendarData.theme || 'classic';

  return (
    <div className="page-container" style={{ paddingBottom: '100px' }}>
      
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', fontSize: '1.2rem' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>natala tomala</Link>
        <Link to="/#about" style={{ textDecoration: 'underline' }}>about</Link>
      </header>

      <div className="edit-controls" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '2rem' }}>
        <button className="btn-outline" onClick={() => setShowThemeModal(true)}>theme</button>
        <button className="btn-outline" onClick={() => setShowPreview(true)}>preview</button>
        
        {/* ZMIANA: Przycisk otwiera modal Share */}
        <button className="btn-outline" onClick={() => setShowShareModal(true)}>share</button>
      </div>

      <div style={{ marginBottom: '2rem' }}>
         <label style={{ fontSize: '0.9rem', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
              Save this link to edit later (keep it secret):
         </label>
         <div className="link-bar" style={{ 
             display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
             width: '100%', maxWidth: '600px', margin: '0 auto', border: '1px solid black', padding: '5px' 
         }}>
            <span style={{ fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: '10px' }}>
              {editLink}
            </span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(editLink);
                alert("Secret edit link copied!");
              }}
              style={{background: 'black', color: 'white', border: 'none', padding: '5px 10px', cursor: 'pointer', height: '30px', width: '80px', fontWeight: 'bold'}}
            >
              COPY
            </button>
         </div>
      </div>

      {/* 3. GRID */}
      <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '15px',
          width: '100%',
          maxWidth: '600px',
          margin: '0 auto'
      }}>
        {calendarData.days.map((content, index) => {
          const dayNumber = index + 1;
          const isEmpty = !content || (typeof content === 'string' && content.trim() === "");
          
          const { src, fileName } = getDoorDetails(currentTheme, dayNumber);
          const isHovered = hoveredIndex === index;

          return (
            <div 
              key={index} 
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              onClick={() => {
                navigate(`/edit/${id}/door/${dayNumber}?token=${urlToken}`);
              }}
              style={{
                width: '100%',
                aspectRatio: '1/1', 
                position: 'relative',
                cursor: 'pointer',
                
                backgroundImage: src ? `url("${src}")` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                
                backgroundColor: src ? 'transparent' : '#ffebee', 
                border: src ? 'none' : '2px dashed red',
                
                opacity: isEmpty ? (isHovered ? 0.9 : 0.5) : 1, 
                transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                zIndex: isHovered ? 10 : 1,
                transition: 'opacity 0.3s ease, transform 0.3s ease',
                boxShadow: isHovered ? '0 10px 20px rgba(0,0,0,0.2)' : 'none'
              }}
            >
              {!src && (
                <div style={{
                  position: 'absolute', top: '50%', left: '50%', 
                  transform: 'translate(-50%, -50%)', 
                  fontSize: '10px', color: 'red', textAlign: 'center', 
                  wordBreak: 'break-all', lineHeight: '1.2'
                }}>
                  NO: <br/>{fileName}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* --- MODAL THEME --- */}
      {showThemeModal && (
        <div className="modal-overlay" onClick={() => setShowThemeModal(false)}>
          <div className="theme-modal" onClick={e => e.stopPropagation()}>
            <h3>CHOOSE THEME</h3>
            <div className="theme-options">
              {themes.map(themeName => {
                  const { src } = getDoorDetails(themeName, 1);
                  return (
                    <div 
                      key={themeName}
                      className={`theme-option ${currentTheme === themeName ? 'selected' : ''}`}
                      onClick={() => handleThemeChange(themeName)}
                      style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px', color:'black', borderColor:'white'}}
                    >
                      {src ? (
                          <img 
                            src={src} 
                            alt={themeName} 
                            style={{width: '60px', height: '80px', objectFit: 'cover', borderRadius: '0px', color:'white'}} 
                          />
                      ) : (
                         <div style={{width:'60px', height:'80px', background:'#eee', fontSize:'10px'}}>NO IMG</div>
                      )}
                      <span>{themeName}</span>
                    </div>
                  );
              })}
            </div>
            <button className="btn-black" style={{marginTop: '1rem', width:'10rem'}} onClick={() => setShowThemeModal(false)}>
              close
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL SHARE (NOWY) --- */}
      {showShareModal && (
        <div className="modal-overlay" onClick={() => setShowShareModal(false)} style={{backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0,0,0,0.4)'}}>
          <div 
             onClick={e => e.stopPropagation()} 
             style={{
                 backgroundColor: 'white', 
                 padding: '30px', 
                 borderRadius: '15px', 
                 width: '100%', 
                 maxWidth: '500px',
                 position: 'relative',
                 boxShadow: '0 10px 40px rgba(0,0,0,0.2)'
             }}
          >

             <button 
                onClick={() => setShowShareModal(false)}
                style={{
                    position: 'absolute', top: '15px', right: '15px',
                    background: 'none', border: 'none', 
                    fontSize: '1.5rem', cursor: 'pointer', fontWeight: 'bold'
                }}
             >
                 ×
             </button>

             <h2 style={{marginTop: 0, marginBottom: '10px', fontSize: '1.5rem'}}>SHAARE :3 </h2>
             <p style={{color: '#666', marginBottom: '30px', lineHeight: '1.4'}}>
                 This is a view-only link. Share it with your loved one so they can open the doors!
             </p>

             <div style={{display: 'flex', gap: '15px'}}>
                 <a 
                    href={publicLink} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{
                        flex: 1,
                        padding: '12px',
                        textAlign: 'center',
                        textDecoration: 'none',
                        border: '2px solid black',
                        borderRadius: '8px',
                        color: 'black',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                 >
                     opeeen
                 </a>

                 <button 
                    onClick={handleCopyLink}
                    style={{
                        flex: 1,
                        padding: '12px',
                        border: '2px solid black',
                        borderRadius: '8px',
                        backgroundColor: 'black',
                        color: 'white',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        fontSize: '1rem'
                    }}
                 >
                     coopy link
                 </button>
             </div>
          </div>
        </div>
      )}

      {/* --- MODAL PREVIEW --- */}
      {showPreview && (
        <div className="modal-overlay" onClick={() => setShowPreview(false)} style={{backdropFilter: 'blur(8px)', backgroundColor: 'rgba(0,0,0,0.6)'}}>
          <div onClick={e => e.stopPropagation()} style={{position: 'relative'}}>
             
             <div style={{
                 width: '390px', 
                 height: '844px', 
                 maxHeight: '90vh', 
                 backgroundColor: '#fff',
                 borderRadius: '40px', 
                 border: '14px solid #1c1c1e', 
                 overflow: 'hidden',
                 position: 'relative',
                 boxShadow: '0 30px 60px rgba(0,0,0,0.4)'
             }}>
                 <div style={{
                     position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                     width: '160px', height: '30px', backgroundColor: '#1c1c1e',
                     borderBottomLeftRadius: '20px', borderBottomRightRadius: '20px', zIndex: 20
                 }}></div>

                 <div style={{height: '44px', background: '#fff', width: '100%', position: 'absolute', top: 0, left: 0, zIndex: 10}}></div>
                 
                 <button 
                    onClick={() => setShowPreview(false)}
                    style={{
                        position: 'absolute', top: '10px', right: '20px', zIndex: 30,
                        background: 'transparent', border: 'none', fontSize: '1.5rem', fontWeight: 'bold', color: '#000', cursor: 'pointer', padding: '5px'
                    }}
                 >
                     ×
                 </button>

                 <iframe 
                    src={publicLink} 
                    title="Mobile Preview"
                    style={{
                        width: '100%', height: '100%', border: 'none', paddingTop: '44px' 
                    }}
                 />
             </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Edit;