import { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useNavigate } from 'react-router-dom';

const Create = () => {
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [loading, setLoading] = useState(false);
  const [days] = useState(Array(24).fill(""));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // 1. Generujemy losowy token (hasło do edycji)
    const editToken = Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);

    try {
      const docRef = await addDoc(collection(db, "calendars"), {
        title,
        description,
        timezone,
        days,
        createdAt: new Date(),
        year: new Date().getFullYear(),
        theme: 'classic',
        // 2. Zapisujemy token w bazie (ważne!)
        editToken: editToken 
      });
      
      // 3. Przekierowujemy do edycji, dodając token do paska adresu
      navigate(`/edit/${docRef.id}?token=${editToken}`);
      
    } catch (error) {
      console.error("Error:", error);
      alert("Błąd. Sprawdź konsolę.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '20px'
    }}>
      {/* Container z ramką */}
      <div style={{ 
        border: '2px solid black', 
        padding: '2rem', 
        width: '100%', 
        maxWidth: '400px',
        backgroundColor: 'white'
      }}>
        <form onSubmit={handleSubmit}>
          
          <label>title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label>description</label>
          <textarea 
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <label>timezone</label>
          <select 
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            style={{ marginBottom: '3rem' }} // Odstęp nad przyciskiem
          >
            <option value="Europe/Warsaw">Europe/Warsaw</option>
            <option value="Europe/London">Europe/London</option>
            <option value="America/New_York">America/New York</option>
          </select>

          <button type="submit" className="btn-black" disabled={loading}>
            {loading ? "creating..." : "create"}
          </button>

        </form>
      </div>
    </div>
  );
};

export default Create;