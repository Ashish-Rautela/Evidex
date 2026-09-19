
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { SearchPage } from './pages/SearchPage';
import { ViewerPage } from './pages/ViewerPage';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <header className="sticky top-0 z-50 glass-panel border-b border-gray-200/50 px-8 py-4 flex items-center justify-between shadow-sm">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-blue-600 text-white p-2 rounded-lg group-hover:bg-blue-700 transition-colors shadow-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
            </div>
            <span className="font-extrabold text-2xl bg-gradient-to-r from-blue-700 to-blue-500 bg-clip-text text-transparent tracking-tight">Evidex</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Link to="/" className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all">Dashboard</Link>
            <Link to="/search" className="px-4 py-2 rounded-lg text-sm font-semibold text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              Search
            </Link>
          </nav>
        </header>
        <main className="p-6 md:p-10 max-w-[1400px] mx-auto animate-fade-in-up">
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
