import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Mail, Lock, User, Building, Eye, EyeOff, AlertCircle, ArrowUpRight } from 'lucide-react';
import { RetroMacIllustration } from '../components/RetroMacIllustration';

export function SignupPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // If already logged in, redirect directly to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    const pwdErrors: string[] = [];
    if (password.length < 8) pwdErrors.push('at least 8 characters');
    if (!/[A-Z]/.test(password)) pwdErrors.push('one uppercase letter');
    if (!/[a-z]/.test(password)) pwdErrors.push('one lowercase letter');
    if (!/[0-9]/.test(password)) pwdErrors.push('one digit');
    if (pwdErrors.length > 0) {
      setErrorMessage(`Password must contain: ${pwdErrors.join(', ')}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await signup(name, email, password, tenantId || undefined);
      navigate('/', { replace: true });
    } catch (err: any) {
      setErrorMessage(err.message || 'Signup failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 flex flex-col md:flex-row items-center gap-10">
      {/* Left side: Retro Illustration & Welcome */}
      <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
        <RetroMacIllustration className="w-56 h-56 mb-4" />
        <h1 className="text-4xl md:text-5xl font-black text-black tracking-tight mb-2">
          Join In.
        </h1>
        <p className="text-lg font-serif italic text-neutral-800">
          Register your organization for contract intelligence.
        </p>
      </div>

      {/* Right side: Retro Mac Window Signup Box */}
      <div className="w-full md:w-[440px] bg-white border-2 border-black rounded-lg shadow-[5px_5px_0px_#000] overflow-hidden">
        {/* Retro Window Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-neutral-100 border-b-2 border-black font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-full border border-black bg-white inline-block"></span>
              <span className="w-2.5 h-2.5 rounded-full border border-black bg-white inline-block"></span>
            </span>
            <span className="font-bold text-black ml-1">Register</span>
          </div>
        </div>

        {/* Window Content */}
        <div className="p-6">
          <h2 className="text-2xl font-black text-black mb-4">Create Account.</h2>

          {errorMessage && (
            <div className="mb-4 p-3 bg-neutral-100 border-2 border-black rounded text-xs font-mono text-black flex items-start gap-2 shadow-[2px_2px_0px_#000]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-mono font-bold text-black mb-1">
                FULL NAME
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Macintosh User"
                  className="w-full pl-9 pr-3 py-2 border-2 border-black rounded font-mono text-sm text-black focus:outline-none focus:bg-neutral-50 shadow-[2px_2px_0px_#000]"
                />
                <User className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-black mb-1">
                EMAIL ADDRESS
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@organization.com"
                  className="w-full pl-9 pr-3 py-2 border-2 border-black rounded font-mono text-sm text-black focus:outline-none focus:bg-neutral-50 shadow-[2px_2px_0px_#000]"
                />
                <Mail className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-black mb-1">
                ORGANIZATION / TENANT ID (OPTIONAL)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="e.g. acme-legal"
                  className="w-full pl-9 pr-3 py-2 border-2 border-black rounded font-mono text-sm text-black focus:outline-none focus:bg-neutral-50 shadow-[2px_2px_0px_#000]"
                />
                <Building className="w-4 h-4 text-neutral-500 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono font-bold text-black mb-1">
                  PASSWORD
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-2 py-2 border-2 border-black rounded font-mono text-xs text-black focus:outline-none focus:bg-neutral-50 shadow-[2px_2px_0px_#000]"
                  />
                  <Lock className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-3 pointer-events-none" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold text-black mb-1">
                  CONFIRM
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-8 py-2 border-2 border-black rounded font-mono text-xs text-black focus:outline-none focus:bg-neutral-50 shadow-[2px_2px_0px_#000]"
                  />
                  <Lock className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-3 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-neutral-600 hover:text-black"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="ink-btn w-full py-2.5 bg-black text-white hover:bg-neutral-800 disabled:opacity-50 font-mono font-bold text-sm tracking-wide rounded"
              >
                {isSubmitting ? 'Registering…' : 'Create Account →'}
              </button>
            </div>
          </form>

          <div className="mt-5 pt-3 border-t-2 border-black/10 flex items-center justify-between text-xs font-mono">
            <span className="text-neutral-600">Already registered?</span>
            <Link
              to="/login"
              className="font-bold text-black hover:underline flex items-center gap-1"
            >
              Sign In <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
