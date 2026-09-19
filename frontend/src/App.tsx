
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { SearchPage } from './pages/SearchPage';
import { ViewerPage } from './pages/ViewerPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <Link to="/" className="font-bold text-xl text-blue-600">Evidex</Link>
          <nav className="space-x-4">
            <Link to="/" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
            <Link to="/search" className="text-gray-600 hover:text-blue-600">Search</Link>
          </nav>
        </header>
        <main className="p-6 max-w-7xl mx-auto">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/viewer/:documentId" element={<ViewerPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
