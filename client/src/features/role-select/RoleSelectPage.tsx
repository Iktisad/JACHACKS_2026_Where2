import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function RoleSelectPage() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<'student' | 'admin' | null>(null)

  function handleStudentCredentials(e: React.MouseEvent) {
    e.stopPropagation()
    navigate('/student/login?prefill=1')
  }

  function handleAdminCredentials(e: React.MouseEvent) {
    e.stopPropagation()
    navigate('/admin/login?prefill=1')
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden" style={{ background: 'var(--background)' }}>

      {/* ── Student Panel ─────────────────────────────────────── */}
      <div
        onClick={() => navigate('/student')}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/student')}
        onMouseEnter={() => setHovered('student')}
        onMouseLeave={() => setHovered(null)}
        className="relative flex-1 flex flex-col items-center justify-center text-left cursor-pointer transition-all duration-500"
        style={{
          minHeight: '48vh',
          background: hovered === 'student'
            ? 'linear-gradient(145deg, #1a5276 0%, #2e86c1 60%, #5dade2 100%)'
            : 'linear-gradient(145deg, #164863 0%, #427D9D 60%, #9BBEC8 100%)',
          padding: '2.5rem 1.5rem',
        }}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, rgba(255,255,255,0.06) 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 50%)`,
          }}
        />

        {/* Floating accent circle */}
        <div
          className="absolute pointer-events-none transition-all duration-500"
          style={{
            width: hovered === 'student' ? 420 : 320,
            height: hovered === 'student' ? 420 : 320,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.04)',
            top: '-80px',
            right: '-80px',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.03)',
            bottom: '40px',
            left: '-40px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-xs">
          {/* Icon */}
          <div
            className="flex items-center justify-center rounded-2xl mb-5 transition-all duration-300"
            style={{
              width: 68,
              height: 68,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              transform: hovered === 'student' ? 'scale(1.08) translateY(-4px)' : 'scale(1)',
              boxShadow: hovered === 'student' ? '0 20px 40px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>

          {/* Label */}
          <div
            className="text-xs font-semibold tracking-widest uppercase mb-2"
            style={{ color: 'rgba(221,242,253,0.6)', letterSpacing: '0.15em' }}
          >
            I am a
          </div>

          <h2
            className="font-bold mb-3 transition-all duration-300"
            style={{
              fontSize: 'clamp(2rem, 6vw, 2.75rem)',
              color: '#ffffff',
              lineHeight: 1.1,
              textShadow: hovered === 'student' ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            Student
          </h2>

          <p className="text-sm leading-relaxed mb-5 hidden sm:block" style={{ color: 'rgba(221,242,253,0.75)' }}>
            Find open study spaces, check real-time occupancy, and get AI-powered spot recommendations.
          </p>

          {/* Features */}
          <div className="flex flex-col gap-1.5 w-full mb-5 hidden sm:flex">
            {['Real-time space availability', 'AI study spot finder', 'Campus leaderboard'].map((feat) => (
              <div key={feat} className="flex items-center gap-2" style={{ color: 'rgba(221,242,253,0.7)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(221,242,253,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-sm">{feat}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-sm transition-all duration-300"
            style={{
              background: 'rgba(255,255,255,0.18)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#ffffff',
              backdropFilter: 'blur(8px)',
              transform: hovered === 'student' ? 'translateY(-2px)' : 'none',
              boxShadow: hovered === 'student' ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            Get Started
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>

          {/* Credentials button */}
          <button
            type="button"
            onClick={handleStudentCredentials}
            className="mt-2.5 flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold transition-all duration-200"
            style={{
              background: 'rgba(255,255,255,0.10)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'rgba(221,242,253,0.85)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Credentials
          </button>
        </div>
      </div>

      {/* ── Center Divider / Logo ─────────────────────────────── */}
      <div
        className="relative z-20 flex items-center justify-center lg:flex-col"
        style={{ flexShrink: 0, height: 0, overflow: 'visible' }}
      >
        {/* Vertical line on desktop */}
        <div
          className="hidden lg:block absolute"
          style={{ width: 1, top: '-100vh', bottom: '-100vh', left: '50%', transform: 'translateX(-50%)', background: 'rgba(155,190,200,0.25)' }}
        />

        {/* Logo badge */}
        <div
          className="relative z-10 flex flex-col items-center justify-center"
          style={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: 'var(--background)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 24px rgba(22,72,99,0.12)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
      </div>

      {/* ── Admin Panel ───────────────────────────────────────── */}
      <div
        onClick={() => navigate('/admin')}
        onKeyDown={(e) => e.key === 'Enter' && navigate('/admin')}
        onMouseEnter={() => setHovered('admin')}
        onMouseLeave={() => setHovered(null)}
        className="relative flex-1 flex flex-col items-center justify-center text-left cursor-pointer transition-all duration-500"
        style={{
          minHeight: '48vh',
          background: hovered === 'admin'
            ? 'linear-gradient(145deg, #f0f4f8 0%, #e2edf5 60%, #cde0ed 100%)'
            : 'linear-gradient(145deg, #f7fbfd 0%, #eef7fc 60%, #ddf2fd 100%)',
          padding: '2.5rem 1.5rem',
        }}
      >
        {/* Background pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 80% 80%, rgba(66,125,157,0.07) 0%, transparent 50%),
                              radial-gradient(circle at 20% 20%, rgba(22,72,99,0.04) 0%, transparent 50%)`,
          }}
        />

        {/* Floating accent circle */}
        <div
          className="absolute pointer-events-none transition-all duration-500"
          style={{
            width: hovered === 'admin' ? 420 : 320,
            height: hovered === 'admin' ? 420 : 320,
            borderRadius: '50%',
            background: 'rgba(66,125,157,0.05)',
            bottom: '-80px',
            left: '-80px',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: 180,
            height: 180,
            borderRadius: '50%',
            background: 'rgba(22,72,99,0.03)',
            top: '40px',
            right: '-40px',
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-xs">
          {/* Icon */}
          <div
            className="flex items-center justify-center rounded-2xl mb-5 transition-all duration-300"
            style={{
              width: 68,
              height: 68,
              background: 'var(--primary)',
              boxShadow: hovered === 'admin'
                ? '0 20px 40px rgba(22,72,99,0.35)'
                : '0 8px 20px rgba(22,72,99,0.2)',
              transform: hovered === 'admin' ? 'scale(1.08) translateY(-4px)' : 'scale(1)',
            }}
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>

          {/* Label */}
          <div
            className="text-xs font-semibold tracking-widest uppercase mb-2"
            style={{ color: 'var(--muted-foreground)', letterSpacing: '0.15em' }}
          >
            I am an
          </div>

          <h2
            className="font-bold mb-3 transition-all duration-300"
            style={{
              fontSize: 'clamp(2rem, 6vw, 2.75rem)',
              color: 'var(--primary)',
              lineHeight: 1.1,
            }}
          >
            Admin
          </h2>

          <p className="text-sm leading-relaxed mb-5 hidden sm:block" style={{ color: 'var(--muted-foreground)' }}>
            Monitor network heatmaps, view client history, and manage campus Wi-Fi infrastructure.
          </p>

          {/* Features */}
          <div className="hidden sm:flex flex-col gap-1.5 w-full mb-5">
            {['Live network heatmaps', 'Client connection history', 'Infrastructure analytics'].map((feat) => (
              <div key={feat} className="flex items-center gap-2" style={{ color: 'var(--muted-foreground)' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span className="text-sm">{feat}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div
            className="flex items-center gap-2 rounded-xl px-5 py-2.5 font-semibold text-sm transition-all duration-300"
            style={{
              background: 'var(--primary)',
              color: '#ffffff',
              transform: hovered === 'admin' ? 'translateY(-2px)' : 'none',
              boxShadow: hovered === 'admin'
                ? '0 12px 28px rgba(22,72,99,0.4)'
                : '0 4px 12px rgba(22,72,99,0.2)',
            }}
          >
            Open Dashboard
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>

          {/* Credentials button */}
          <button
            type="button"
            onClick={handleAdminCredentials}
            className="mt-2.5 flex items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold transition-all duration-200"
            style={{
              background: 'rgba(22,72,99,0.08)',
              border: '1px solid rgba(22,72,99,0.18)',
              color: 'var(--primary)',
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            Credentials
          </button>
        </div>
      </div>
    </div>
  )
}
