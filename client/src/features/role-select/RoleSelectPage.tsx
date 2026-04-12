import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function RoleSelectPage() {
  const navigate = useNavigate()
  const [hovered, setHovered] = useState<'student' | 'admin' | null>(null)

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden" style={{ background: 'var(--background)' }}>

      {/* ── Student Panel ─────────────────────────────────────── */}
      <button
        onClick={() => navigate('/student')}
        onMouseEnter={() => setHovered('student')}
        onMouseLeave={() => setHovered(null)}
        className="relative flex-1 flex flex-col items-center justify-center text-left cursor-pointer border-0 outline-none transition-all duration-500"
        style={{
          minHeight: '50vh',
          background: hovered === 'student'
            ? 'linear-gradient(145deg, #1a5276 0%, #2e86c1 60%, #5dade2 100%)'
            : 'linear-gradient(145deg, #164863 0%, #427D9D 60%, #9BBEC8 100%)',
          padding: '3rem 2.5rem',
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
            className="flex items-center justify-center rounded-2xl mb-7 transition-all duration-300"
            style={{
              width: 80,
              height: 80,
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.2)',
              transform: hovered === 'student' ? 'scale(1.08) translateY(-4px)' : 'scale(1)',
              boxShadow: hovered === 'student' ? '0 20px 40px rgba(0,0,0,0.2)' : 'none',
            }}
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>

          {/* Label */}
          <div
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: 'rgba(221,242,253,0.6)', letterSpacing: '0.15em' }}
          >
            I am a
          </div>

          <h2
            className="font-bold mb-4 transition-all duration-300"
            style={{
              fontSize: '2.75rem',
              color: '#ffffff',
              lineHeight: 1.1,
              textShadow: hovered === 'student' ? '0 4px 20px rgba(0,0,0,0.3)' : 'none',
            }}
          >
            Student
          </h2>

          <p className="text-base leading-relaxed mb-8" style={{ color: 'rgba(221,242,253,0.75)' }}>
            Find open study spaces, check real-time occupancy, and get AI-powered spot recommendations.
          </p>

          {/* Features */}
          <div className="flex flex-col gap-2 w-full mb-8">
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
            className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-sm transition-all duration-300"
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
        </div>

        {/* Divider hint on mobile */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 lg:hidden"
          style={{ width: 40, height: 2, background: 'rgba(255,255,255,0.2)', borderRadius: 1 }}
        />
      </button>

      {/* ── Center Divider / Logo ─────────────────────────────── */}
      <div
        className="relative z-20 flex items-center justify-center lg:flex-col"
        style={{ flexShrink: 0 }}
      >
        {/* Vertical line on desktop */}
        <div
          className="hidden lg:block absolute inset-y-0 left-1/2 -translate-x-1/2"
          style={{ width: 1, background: 'rgba(155,190,200,0.25)' }}
        />
        {/* Horizontal line on mobile */}
        <div
          className="lg:hidden absolute inset-x-0 top-1/2 -translate-y-1/2"
          style={{ height: 1, background: 'rgba(155,190,200,0.25)' }}
        />

        {/* Logo badge */}
        <div
          className="relative z-10 flex flex-col items-center justify-center"
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: 'var(--background)',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 24px rgba(22,72,99,0.12)',
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
      </div>

      {/* ── Admin Panel ───────────────────────────────────────── */}
      <button
        onClick={() => navigate('/admin')}
        onMouseEnter={() => setHovered('admin')}
        onMouseLeave={() => setHovered(null)}
        className="relative flex-1 flex flex-col items-center justify-center text-left cursor-pointer border-0 outline-none transition-all duration-500"
        style={{
          minHeight: '50vh',
          background: hovered === 'admin'
            ? 'linear-gradient(145deg, #f0f4f8 0%, #e2edf5 60%, #cde0ed 100%)'
            : 'linear-gradient(145deg, #f7fbfd 0%, #eef7fc 60%, #ddf2fd 100%)',
          padding: '3rem 2.5rem',
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
            className="flex items-center justify-center rounded-2xl mb-7 transition-all duration-300"
            style={{
              width: 80,
              height: 80,
              background: 'var(--primary)',
              boxShadow: hovered === 'admin'
                ? '0 20px 40px rgba(22,72,99,0.35)'
                : '0 8px 20px rgba(22,72,99,0.2)',
              transform: hovered === 'admin' ? 'scale(1.08) translateY(-4px)' : 'scale(1)',
            }}
          >
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
            </svg>
          </div>

          {/* Label */}
          <div
            className="text-xs font-semibold tracking-widest uppercase mb-3"
            style={{ color: 'var(--muted-foreground)', letterSpacing: '0.15em' }}
          >
            I am an
          </div>

          <h2
            className="font-bold mb-4 transition-all duration-300"
            style={{
              fontSize: '2.75rem',
              color: 'var(--primary)',
              lineHeight: 1.1,
            }}
          >
            Admin
          </h2>

          <p className="text-base leading-relaxed mb-8" style={{ color: 'var(--muted-foreground)' }}>
            Monitor network heatmaps, view client history, and manage campus Wi-Fi infrastructure.
          </p>

          {/* Features */}
          <div className="flex flex-col gap-2 w-full mb-8">
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
            className="flex items-center gap-2 rounded-xl px-6 py-3 font-semibold text-sm transition-all duration-300"
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
        </div>
      </button>

      {/* ── Logo footer ───────────────────────────────────────── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30">
        <img
          src="/icons/web logo.svg"
          alt="WhereTo"
          className="h-30 w-auto object-contain"
          style={{ opacity: 0.45 }}
        />
      </div>
    </div>
  )
}
