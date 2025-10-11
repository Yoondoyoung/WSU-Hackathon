import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import CreatePage from './pages/CreatePage.jsx';
import LibraryPage from './pages/LibraryPage.jsx';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/create" replace />} />
        <Route path="/create" element={<CreatePage />} />
        <Route path="/library" element={<LibraryPage />} />
      </Routes>
    </Router>
  );
};

export default App;
