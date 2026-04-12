import { useNavigate } from 'react-router-dom'

export default function RoleSelectPage() {
  const navigate = useNavigate()

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center texture-bg"
      style={{ background: 'var(--hero)' }}
    >
      {/* Header */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
          style={{ background: 'rgba(255,255,255,0.15)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-white mb-2">WhereTo Campus</h1>
        <p className="text-lg" style={{ color: 'var(--primary-foreground)', opacity: 0.75 }}>
          Select how you'd like to continue
        </p>
      </div>

      {/* Role Cards */}
      <div className="flex flex-col sm:flex-row gap-6 w-full max-w-2xl px-6">

        {/* Student Card */}
        <button
          onClick={() => navigate('/student')}
          className="flex-1 group rounded-2xl p-8 text-left transition-all duration-200 cursor-pointer"
          style={{
            background: 'var(--card)',
            border: '2px solid var(--border)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.border = '2px solid var(--primary-light)'
            ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(66,125,157,0.25)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.border = '2px solid var(--border)'
            ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
          }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
            style={{ background: 'var(--muted)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
              <path d="M6 12v5c3 3 9 3 12 0v-5" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
            Student
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            Find study spaces, check real-time occupancy, and discover the best spots on campus.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--primary)' }}>
            Enter as Student
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </button>

        {/* Admin Card */}
        <button
          onClick={() => navigate('/admin')}
          className="flex-1 group rounded-2xl p-8 text-left transition-all duration-200 cursor-pointer"
          style={{
            background: 'var(--primary)',
            border: '2px solid var(--primary)',
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--primary-dark)'
            ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = '0 12px 40px rgba(22,72,99,0.4)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLElement).style.background = 'var(--primary)'
            ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
            ;(e.currentTarget as HTMLElement).style.boxShadow = 'none'
          }}
        >
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#ffffff' }}>
            Admin
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'rgba(221,242,253,0.8)' }}>
            Monitor network heatmaps, view client history, and manage campus infrastructure.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm font-medium text-white">
            Enter as Admin
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Footer */}
      <p className="mt-12 text-sm" style={{ color: 'rgba(221,242,253,0.45)' }}>
        Jackhacks · ITS Challenge
      </p>
    </div>
  )
}
