import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import GamePage from './pages/GamePage';
import './App.css';

function App() {
  return (
    <div className="app-wrapper">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/games/:gameId" element={<GamePage />} />
      </Routes>
    </div>
  );
}

export default App;
