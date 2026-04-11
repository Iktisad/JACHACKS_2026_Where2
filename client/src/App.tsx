import { Routes, Route, Navigate, NavLink } from 'react-router-dom'
import HistoryPage from '@/features/history/HistoryPage'
import HeatmapPage from '@/features/heatmap/HeatmapPage'

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-6 shadow-sm">
        <span className="font-semibold text-gray-900 text-lg">UniFi Dashboard</span>
        <NavLink
          to="/history"
          className={({ isActive }) =>
            `text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`
          }
        >
          History
        </NavLink>
        <NavLink
          to="/heatmap"
          className={({ isActive }) =>
            `text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'}`
          }
        >
          Heatmap
        </NavLink>
      </nav>
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/history" replace />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/heatmap" element={<HeatmapPage />} />
        </Routes>
      </main>
    </div>
  )
}
