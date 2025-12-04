// src/pages/Calendar.jsx
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { toZonedTime } from 'date-fns-tz';

const doorImages = import.meta.glob('../assets/doors/*.png', { eager: true, import: 'default' });

const Calendar = () => {
  const { id } = useParams();
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [openDoors, setOpenDoors] = useState(() => {
    const saved = localStorage.getItem(`calendar-${id}-opened`);
    return saved ? JSON.parse(saved) : [];
  });

  const [expandedDay, setExpandedDay] = useState(null);
  const [showLockedModal, setShowLockedModal] = useState(false);

  //dzisiajszy numer dnia
  const [currentDayNumber, setCurrentDayNumber] = useState(1);

  const themePrefixes = {
    'classic': 'b',
    'elegant': 'c',
    'gifts': 'a',
  };

  const themeStyles = {
    'classic': { bg: '#000000', text: '#ffffff' },
    'elegant': { bg: '#6b2d2eff', text: '#efc186ff' },
    'gifts':   { bg: '#ffffff', text: '#000000' }
  };

  useEffect(() => {
    const fetchCalendar = async () => {
      try {
        const docRef = doc(db, "calendars", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCalendar(data);

          // --- OBLICZANIE OBECNEGO DNIA ---
          const now = new Date();
          const timeZone = data.timezone || 'UTC';
          const zonedDate = toZonedTime(now, timeZone);
          setCurrentDayNumber(zonedDate.getDate()); 

        } else {
          console.log("No such calendar!");
        }
      } catch (error) {
        console.error("Error fetching:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCalendar();
  }, [id]);

  const handleOpenDoor = (dayIndex) => {
    if (!calendar) return;

    // --- LOGIKA DATY ---
    const now = new Date();
    const timeZone = calendar.timezone || 'UTC';
    const zonedDate = toZonedTime(now, timeZone);
    
    const currentMonth = zonedDate.getMonth();
    const currentDay = zonedDate.getDate();
    const currentYear = zonedDate.getFullYear();
    
    const targetDay = dayIndex + 1;
    const targetYear = calendar.year || new Date().getFullYear();

    const isPastYear = currentYear > targetYear;
    const isDecember = currentMonth === 11; 
    const isDayUnlocked = isDecember && currentDay >= targetDay;

    const isAllowed = isPastYear || isDayUnlocked;

    // TRYB TESTOWY:
    if (isAllowed) {
      if (!openDoors.includes(dayIndex)) {
          const newOpenDoors = [...openDoors, dayIndex];
          setOpenDoors(newOpenDoors);
          localStorage.setItem(`calendar-${id}-opened`, JSON.stringify(newOpenDoors));
      }
      setExpandedDay(dayIndex);
    } else {
      setShowLockedModal(true);
    }
  };

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

  const renderContent = (content) => {
    if (typeof content === 'object' && content.type === 'canvas') {
        return (
            <div style={{
                width: '100%', height: '100%', 
                backgroundImage: content.background ? `url(${content.background})` : 'none',
                backgroundSize: 'cover', backgroundPosition: 'center',
                position: 'relative', overflow: 'hidden'
            }}>
                {content.elements && content.elements.map(el => (
                    <div key={el.id} style={{
                        position: 'absolute', 
                        left: `${el.x}%`, top: `${el.y}%`, 
                        transform: `translate(-50%, -50%) rotate(${el.rotation || 0}deg)`,
                        width: el.type === 'text' ? 'auto' : `${el.width}px`
                    }}>
                        {el.type === 'image' || el.type === 'sticker' ? (
                            <img src={el.src} style={{width: '100%', display:'block'}} alt="" />
                        ) : el.type === 'text' ? (
                             <div style={{
                                fontFamily: el.fontFamily, fontSize: `${el.fontSize}px`, 
                                fontWeight: el.bold?'bold':'normal', fontStyle: el.italic?'italic':'normal',
                                color: el.color, whiteSpace: 'nowrap'
                             }}>{el.content}</div>
                        ) : el.type === 'button' ? (
                            <a href={el.url} target="_blank" rel="noreferrer" className="btn-black" style={{
                                textDecoration:'none', fontSize:`${el.fontSize}px`, padding:'5px 15px', display:'block',
                                background: 'black', color: 'white', borderRadius: '4px'
                            }}>
                                {el.content}
                            </a>
                        ) : null}
                    </div>
                ))}
            </div>
        );
    }
    return (
        <div style={{
            height:'100%', display:'flex', alignItems:'center', justifyContent:'center', 
            padding:'20px', textAlign:'center', fontSize:'1.2rem', background: 'white', color: 'black'
        }}>
            {typeof content === 'string' && content ? content : 'Empty'}
        </div>
    );
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!calendar) return <div className="error">Calendar not found.</div>;

  const currentTheme = calendar.theme || 'classic';
  const activeStyle = themeStyles[currentTheme] || themeStyles['classic'];

  return (
    <div className="calendar-view container" style={{
        padding: '20px', 
        maxWidth: '600px', 
        margin: '0 auto',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
        backgroundColor: activeStyle.bg,
        color: activeStyle.text,
        transition: 'background-color 0.5s ease'
    }}>
      
      {/* NAGŁÓWEK Z NUMEREM DNIA */}
      <header className="calendar-header" style={{textAlign: 'center', marginBottom: '2rem'}}>
        
        {/* WIELKI NUMER DNIA */}
        <div style={{
            fontSize: '6rem', 
            fontWeight: 'bold',
            lineHeight: '1',
            letterSpacing: '-5px',
            marginBottom: '10px'
        }}>
            {currentDayNumber}
        </div>

        <h1 style={{fontSize: '1.2rem', margin: '0 0 0.5rem 0', fontWeight: 'normal', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.9}}>
            {calendar.title}
        </h1>
        <p style={{fontSize: '1rem', margin: 0, opacity: 0.7}}>
            {calendar.description || "A gift for you :)"}
        </p>
      </header>

      {/* GRID 2 KOLUMNY */}
      <div style={{
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)', 
          gap: '15px',
          width: '100%',
          paddingBottom: '100px'
      }}>
        {calendar.days.map((content, index) => {
          const dayNumber = index + 1;
          const isOpen = openDoors.includes(index);
          const { src } = getDoorDetails(currentTheme, dayNumber);

          return (
            <div 
              key={index} 
              onClick={() => handleOpenDoor(index)}
              style={{
                aspectRatio: '1/1',
                position: 'relative',
                cursor: 'pointer',
                perspective: '1000px',
                width: '100%'
              }}
            >
              <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundColor: '#f9f9f9',
                  border: '1px solid #ccc',
                  overflow: 'hidden',
                  zIndex: 1
              }}>
                   <div style={{width: '100%', height: '100%', transform: 'scale(1)', transformOrigin: 'center'}}>
                       {isOpen ? renderContent(content) : null}
                   </div>
              </div>

              {/* WARSTWA 2: DRZWI */}
              <div style={{
                  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                  backgroundImage: src ? `url("${src}")` : 'none',
                  backgroundColor: src ? 'transparent' : '#333',
                  backgroundSize: 'cover', backgroundPosition: 'center',
                  zIndex: 2,
                  transition: 'transform 0.6s ease-in-out, opacity 0.3s',
                  transformOrigin: 'left',
                  transform: isOpen ? 'rotateY(-110deg)' : 'rotateY(0deg)', 
                  opacity: isOpen ? 0 : 1, 
                  pointerEvents: isOpen ? 'none' : 'auto',
                  border: src ? 'none' : '1px solid #ccc'
              }}>
                 {!src && (
                     <div style={{
                         color: 'white', fontWeight: 'bold', fontSize: '1.5rem', 
                         height:'100%', display:'flex', alignItems:'center', justifyContent:'center'
                     }}>
                         {dayNumber}
                     </div>
                 )}
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MODAL POWIĘKSZENIA  --- */}
      {expandedDay !== null && (
          <div 
            className="zoom-overlay"
            onClick={() => setExpandedDay(null)}
            style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.85)',
                zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
                backdropFilter: 'blur(5px)'
            }}
          >
              <div 
                onClick={(e) => e.stopPropagation()} 
                style={{
                    width: '100%', maxWidth: '400px', 
                    aspectRatio: '1/1',
                    backgroundColor: 'white',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: '0 0 30px rgba(255,255,255,0.2)'
                }}
              >
                  <button 
                    onClick={() => setExpandedDay(null)}
                    style={{
                        position: 'absolute', top: '10px', right: '10px',
                        background: 'rgba(0,0,0,0.5)', color: 'white',
                        border: 'none', borderRadius: '50%',
                        width: '30px', height: '30px', cursor: 'pointer', zIndex: 100
                    }}
                  >
                      ✕
                  </button>
                  {renderContent(calendar.days[expandedDay])}
              </div>
          </div>
      )}

      {/* --- MODAL LOCKED DOOR --- */}
      {showLockedModal && (
          <div 
            onClick={() => setShowLockedModal(false)}
            style={{
                position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                backgroundColor: 'rgba(0,0,0,0.5)', 
                zIndex: 9999,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(3px)'
            }}
          >
              <div 
                onClick={(e) => e.stopPropagation()} 
                style={{
                    backgroundColor: 'white',
                    padding: '30px 40px',
                    borderRadius: '15px',
                    textAlign: 'center',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                    minWidth: '250px',
                    color: 'black'
                }}
              >
                  <h2 style={{marginTop: 0, fontSize: '1.8rem', marginBottom: '10px'}}>soon &lt;3</h2>
                  <p style={{marginBottom: '25px', color: '#666'}}>...come back later!</p>
                  
                  <button 
                    onClick={() => setShowLockedModal(false)}
                    style={{
                        background: 'black', 
                        color: 'white', 
                        border: 'none',
                        padding: '10px 25px',
                        fontSize: '1rem',
                        cursor: 'pointer',
                        borderRadius: '25px',
                        fontWeight: 'bold'
                    }}
                  >
                      okayyy
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};

export default Calendar;