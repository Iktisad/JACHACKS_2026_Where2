import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { ThemeToggle } from '../components/ThemeToggle';

export function AdminLogin() {
  const { login } = useAdminAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password) return;
    setError(null);
    setLoading(true);
    try {
      await login(email.trim(), password);
      navigate('/admin');
    } catch (err: any) {
      setError(err?.message ?? 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--background)' }}>

      {/* ── Hero band ──────────────────────────────────────────── */}
      <div
        className="px-6 pt-14 pb-16 texture-bg relative overflow-hidden"
        style={{ background: 'var(--hero)' }}
      >
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full border border-white/5" />
        <div className="absolute right-16 top-20 w-20 h-20 rounded-full border border-white/5" />

        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative max-w-sm mx-auto"
        >
          <div className="flex items-center justify-between mb-5">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm transition-colors"
            >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
              Back to role select
            </Link>
            <ThemeToggle variant="dark" />
          </div>

          <div className="flex items-center gap-3 mb-4">
            <div
              className="flex items-center justify-center rounded-xl"
              style={{ width: 44, height: 44, background: 'rgba(255,255,255,0.12)' }}
            >
              <ShieldCheck className="w-5 h-5 text-white" strokeWidth={1.8} />
            </div>
            <div>
              <h1 className="text-[26px] font-semibold text-white tracking-tight leading-snug">
                Admin sign in
              </h1>
              <p className="text-[13px]" style={{ color: 'rgba(255,255,255,0.55)' }}>
                ITS staff access only
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Form card ──────────────────────────────────────────── */}
      <div className="flex-1 px-4 -mt-8 relative z-10 max-w-sm mx-auto w-full pb-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="rounded-3xl border shadow-xl p-6"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl px-4 py-3 text-[13px] border"
                style={{
                  background: 'color-mix(in srgb, var(--destructive) 8%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--destructive) 20%, transparent)',
                  color: 'var(--destructive)',
                }}
              >
                {error}
              </motion.div>
            )}

            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--muted-foreground)' }}
                  strokeWidth={1.7}
                />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@johnabbott.qc.ca"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border text-[14px] focus:outline-none transition-colors"
                  style={{
                    background: 'var(--card)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label
                className="block text-[11px] font-semibold uppercase tracking-widest mb-1.5"
                style={{ color: 'var(--muted-foreground)' }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'var(--muted-foreground)' }}
                  strokeWidth={1.7}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 rounded-xl border text-[14px] focus:outline-none transition-colors"
                  style={{
                    background: 'var(--card)',
                    borderColor: 'var(--border)',
                    color: 'var(--foreground)',
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: 'var(--muted-foreground)' }}
                >
                  {showPassword
                    ? <EyeOff className="w-4 h-4" strokeWidth={1.7} />
                    : <Eye className="w-4 h-4" strokeWidth={1.7} />
                  }
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-[14px] shadow-sm disabled:opacity-50 disabled:pointer-events-none mt-2 transition-colors"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</>
              ) : (
                <>Sign in to dashboard <ArrowRight className="w-4 h-4" strokeWidth={2} /></>
              )}
            </button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="mt-5 rounded-2xl border px-4 py-3"
          style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--muted-foreground)' }}>
            Demo credentials
          </p>
          <div className="space-y-1">
            <p className="text-[12px]" style={{ color: 'var(--foreground)' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Email:</span>{' '}
              admin@johnabbott.qc.ca
            </p>
            <p className="text-[12px]" style={{ color: 'var(--foreground)' }}>
              <span style={{ color: 'var(--muted-foreground)' }}>Password:</span>{' '}
              admin123
            </p>
          </div>
        </motion.div>

        {/* ── Navigation footer ──────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="mt-4 flex items-center justify-center gap-1 text-[13px]"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <Link to="/student/login" className="font-semibold hover:underline underline-offset-2" style={{ color: 'var(--primary)' }}>
            Switch to Student
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
