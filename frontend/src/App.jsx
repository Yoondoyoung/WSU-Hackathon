import { useState } from 'react';
import CreatePage from './pages/CreatePage.jsx';
import LibraryPage from './pages/LibraryPage.jsx';

const App = () => {
  const [currentView, setCurrentView] = useState('create'); // 'create' or 'library'

  // Show Library view
  if (currentView === 'library') {
    return <LibraryPage onNavigateToCreate={() => setCurrentView('create')} />;
  }

  // Show Create view
  return <CreatePage onNavigateToLibrary={() => setCurrentView('library')} />;
};

export default App;
