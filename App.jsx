// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import About from './pages/About';
import Create from './pages/Create';
import Calendar from './pages/Calendar';
import Edit from './pages/Edit';
import DoorEditor from './pages/DoorEditor'; 
import { SettingsProvider } from './lib/settings';

function App() {
  return (
     <SettingsProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/create" element={<Create />} />
        
        <Route path="/edit/:id" element={<Edit />} />
        <Route path="/edit/:id/door/:day" element={<DoorEditor />} />
        
        <Route path="/c/:id" element={<Calendar />} />
      </Routes>
    </BrowserRouter>
    </SettingsProvider>
  );
}

export default App;
