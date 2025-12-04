import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import eyes from '../assets/stickers/s-12.png'; 
import kid from '../assets/kid.png';
import rabbit from '../assets/rabbit.png';

const Home = () => {
  const [showSurprise, setShowSurprise] = useState(false);
  const { hash } = useLocation();

  // Ta funkcja obsługuje przewijanie, gdy klikniesz przycisk będąc już na stronie
  const scrollToAbout = () => {
    const element = document.getElementById('about');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Ten efekt obsługuje przewijanie, gdy wchodzisz z innej strony (np. z Edit)
  useEffect(() => {
    if (hash) {
      const element = document.getElementById(hash.replace('#', ''));
      if (element) {
        setTimeout(() => {
            element.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    }
  }, [hash]);

  return (
    <div className="page-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3rem', fontSize: '1.2rem' }}>
        <span style={{ fontWeight: 'bold' }}>natala tomala</span>
        
        {/* ZMIANA: Zamiast Link, używamy span z onClick. To zapobiega "nawigacji" i tylko przewija. */}
        <span 
          onClick={scrollToAbout}
          style={{ textDecoration: 'underline', cursor: 'pointer' }} 
          className="hover-pop"
        >
          about
        </span>
      </header>

      <main style={{ textAlign: 'center' }}>
        
        {/* EYES SECTION */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '1rem' }}>
          <img 
            src={eyes} 
            alt="eye" 
            className="hover-wiggle" 
            style={{ width: '200px', height: '200px', objectFit: 'contain' }} 
          />
        </div>

        <Link to="/create">
          <button className="btn-black hover-pop">create</button>
        </Link>
        <p style={{ fontSize: '1.2rem', marginTop: '0.5rem' }}>your calendar</p>

        {/* PREVIEW GRID */}
        <div style={{ border: '2px solid black', padding: '10px', margin: '3rem 0', background: 'white' }}>
          <p style={{ margin: '0 0 1rem 0', textAlign: 'left', fontSize: '1rem' }}>
            open the windows, you can also open MacOS but Linux is excluded
          </p>
          
       <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(4, 1fr)', 
            gap: '10px' 
          }}>
            {Array(12).fill(null).map((_, i) => (
              <div 
                key={i} 
                className="grid-window"
                onClick={() => setShowSurprise(true)} 
                style={{ 
                  aspectRatio: '1', 
                  backgroundColor: 'black',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  userSelect: 'none'
                }}
              >
                {i + 1} 
              </div>
            ))}
          </div>
        </div>

        <div id="about" style={{ marginTop: '4rem' }}>
          <p style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>i cooked this</p>
          
          <img 
            src={kid} 
            alt="kid meme" 
            className="hover-pop" 
            style={{ width: '200px', display: 'block', margin: '0 auto 2rem auto' }} 
          />

          <p style={{ maxWidth: '400px', margin: '0 auto', lineHeight: '1.4' }}>
            if there's a bug you can reach me on LinkedIn but i'm not going to go on this app to read this...
          </p>

          <div style={{ marginTop: '3rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.8rem' }}>© natala tomala - terms</span>
            <img 
                src={rabbit} 
                alt="rab" 
                className="hover-wiggle" 
                style={{ width: '100px' }} 
            />
          </div>
        </div>
      </main>

      {/* --- SURPRISE MODAL --- */}
      {showSurprise && (
        <div className="surprise-overlay" onClick={() => setShowSurprise(false)}>
            <div className="surprise-box" onClick={(e) => e.stopPropagation()}>
                <h2 style={{fontSize: '2rem', margin: '0 0 1rem 0'}}>SURPRISE!</h2>
                <p style={{fontSize: '1.2rem', marginBottom: '2rem'}}>
                    There is nothing here bro...      <br></br>
                    Have a nice day!
                </p>
                <button className="btn-black" onClick={() => setShowSurprise(false)}>
                    Close
                </button>
            </div>
        </div>
      )}

    </div>
  );
};

export default Home;