import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import HistoryPage from '@/features/history/HistoryPage'
import HeatmapPage from '@/features/heatmap/HeatmapPage'
import RoleSelectPage from '@/features/role-select/RoleSelectPage'
import { StudentApp } from '@/student/StudentApp'

function AdminShell() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <nav
        className="px-6 py-4 flex items-center gap-6 shadow-sm"
        style={{ background: 'var(--card)', borderBottom: '1px solid var(--border)' }}
      >
        <NavLink to="/" className="font-semibold text-lg" style={{ color: 'var(--foreground)' }}>
          UniFi Dashboard
        </NavLink>
        <NavLink
          to="/admin/history"
          style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' })}
          className="text-sm font-medium transition-colors"
        >
          History
        </NavLink>
        <NavLink
          to="/admin/heatmap"
          style={({ isActive }) => ({ color: isActive ? 'var(--primary)' : 'var(--muted-foreground)' })}
          className="text-sm font-medium transition-colors"
        >
          Heatmap
        </NavLink>
        <div className="ml-auto">
          <NavLink
            to="/"
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--muted-foreground)', background: 'var(--muted)' }}
          >
            ← Switch Role
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
