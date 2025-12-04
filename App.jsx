// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Create from './pages/Create';
import Calendar from './pages/Calendar';
import Edit from './pages/Edit';
import DoorEditor from './pages/DoorEditor'; 

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/create" element={<Create />} />
        
        <Route path="/edit/:id" element={<Edit />} />
        <Route path="/edit/:id/door/:day" element={<DoorEditor />} />
        
        <Route path="/c/:id" element={<Calendar />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;