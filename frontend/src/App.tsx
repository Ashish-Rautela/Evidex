import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { DashboardPage } from './pages/DashboardPage';
import { SearchPage } from './pages/SearchPage';
import { ViewerPage } from './pages/ViewerPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { useAuth } from './hooks/useAuth';
import { 
  Search, 
  LogIn, 
  LogOut, 
  UserPlus, 
  ShieldCheck, 
  Monitor
} from 'lucide-react';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function NavigationHeader() {
  const { user, isAuthenticated, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 bg-white border-b-2 border-black px-4 md:px-8 py-2.5 shadow-[0px_2px_0px_#000]">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Retro Mac Header Brand */}
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 group">
            {/* Vintage Mac Finder Icon */}
            <div className="w-8 h-8 bg-black text-white rounded border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000] group-hover:bg-neutral-800 transition-colors">
              <Monitor className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono font-black text-xl tracking-tighter text-black leading-tight">
                Evidex
              </span>
              <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 font-bold">
                Contract Intel
              </span>
            </div>
          </Link>

          {/* Nav Tabs only visible when authenticated */}
          {isAuthenticated && (
            <nav className="flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-1.5 rounded font-mono text-xs font-bold transition-colors ${
                  isActive('/') 
                    ? 'bg-black text-white' 
                    : 'text-black hover:bg-neutral-100'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/search"
                className={`px-3 py-1.5 rounded font-mono text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  isActive('/search') 
                    ? 'bg-black text-white' 
                    : 'text-black hover:bg-neutral-100'
                }`}
              >
                <Search className="w-3.5 h-3.5" />
                Search
              </Link>
            </nav>
          )}
        </div>

        {/* Right side: Auth State Controls */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 bg-neutral-100 border-2 border-black rounded text-xs font-mono font-bold shadow-[1.5px_1.5px_0px_#000]">
                <ShieldCheck className="w-3.5 h-3.5 text-black" />
                <span className="text-black">{user.name}</span>
                <span className="text-neutral-500 text-[10px]">[{user.tenantId}]</span>
              </div>
              <button
                onClick={logout}
                className="ink-btn px-3 py-1.5 bg-white text-black hover:bg-black hover:text-white rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors"
                title="Sign out of Evidex"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className={`ink-btn px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 ${
                  isActive('/login')
                    ? 'bg-black text-white'
                    : 'bg-white text-black hover:bg-neutral-100'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </Link>
              <Link
                to="/signup"
                className={`ink-btn px-3 py-1.5 rounded text-xs font-mono font-bold flex items-center gap-1.5 ${
                  isActive('/signup')
                    ? 'bg-black text-white'
                    : 'bg-black text-white hover:bg-neutral-800'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Register</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <NavigationHeader />
        <main className="flex-1 p-4 md:p-8 max-w-[1400px] mx-auto w-full">
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/search" 
              element={
                <ProtectedRoute>
                  <SearchPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/viewer/:documentId" 
              element={
                <ProtectedRoute>
                  <ViewerPage />
                </ProtectedRoute>
              } 
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Minimal Retro Footer */}
        <footer className="border-t-2 border-black bg-white py-4 px-6 mt-auto">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-mono text-neutral-600">
            <div className="flex items-center gap-2">
              <span className="font-bold text-black">Evidex OS</span>
              <span>·</span>
              <span>Contract Intelligence Engine</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
