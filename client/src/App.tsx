import { Routes, Route } from 'react-router-dom'
import HistoryPage from '@/features/history/HistoryPage'
import HeatmapPage from '@/features/heatmap/HeatmapPage'
import AdminDashboard from '@/features/admin/AdminDashboard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import RoleSelectPage from '@/features/role-select/RoleSelectPage'
import { StudentApp } from '@/student/StudentApp'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelectPage />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboard />} />
        <Route path="history" element={<HistoryPage />} />
        <Route path="heatmap" element={<HeatmapPage />} />
      </Route>
      <Route path="/student/*" element={<StudentApp />} />
    </Routes>
  )
}
