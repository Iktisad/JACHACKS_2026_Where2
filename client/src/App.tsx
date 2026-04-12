import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import HistoryPage from '@/features/history/HistoryPage'
import HeatmapPage from '@/features/heatmap/HeatmapPage'
import RoleSelectPage from '@/features/role-select/RoleSelectPage'
import { StudentApp } from '@/student/StudentApp'

function AdminShell() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      {/* Top bar */}
      <nav
        className="px-6 py-3 flex items-center gap-1 shadow-sm"
        style={{ background: 'var(--hero)', color: 'var(--hero-foreground)' }}
      >
        <NavLink to="/" className="font-semibold text-lg tracking-tight text-white mr-6">
          WhereTo Admin
        </NavLink>
        {[
          { to: '/admin/history', label: 'History' },
          { to: '/admin/heatmap', label: 'Live Heatmap' },
        ].map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className="text-sm font-medium px-3 py-1.5 rounded-lg transition-colors"
            style={({ isActive }) => ({
              color: isActive ? '#ffffff' : 'rgba(221,242,253,0.65)',
              background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
            })}
          >
            {label}
          </NavLink>
        ))}
        <div className="ml-auto">
          <NavLink
            to="/"
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'rgba(221,242,253,0.6)', background: 'rgba(255,255,255,0.08)' }}
          >
            Switch Role
          </NavLink>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route index element={<Navigate to="/admin/history" replace />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="heatmap" element={<HeatmapPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelectPage />} />
      <Route path="/admin/*" element={<AdminShell />} />
      <Route path="/student/*" element={<StudentApp />} />
    </Routes>
  )
}
