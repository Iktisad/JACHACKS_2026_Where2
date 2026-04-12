import { Routes, Route, Navigate } from 'react-router-dom'
import HistoryPage from '@/features/history/HistoryPage'
import HeatmapPage from '@/features/heatmap/HeatmapPage'
import AdminDashboard from '@/features/admin/AdminDashboard'
import { AdminLayout } from '@/features/admin/components/AdminLayout'
import { AdminAuthProvider } from '@/features/admin/context/AdminAuthContext'
import { AdminProtectedRoute, AdminGuestRoute } from '@/features/admin/components/AdminProtectedRoute'
import { AdminLogin } from '@/features/admin/pages/AdminLogin'
import RoleSelectPage from '@/features/role-select/RoleSelectPage'
import { StudentApp } from '@/student/StudentApp'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<RoleSelectPage />} />

      <Route path="/admin/*" element={
        <AdminAuthProvider>
          <Routes>
            {/* Guest-only */}
            <Route element={<AdminGuestRoute />}>
              <Route path="login" element={<AdminLogin />} />
            </Route>

            {/* Protected */}
            <Route element={<AdminProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="heatmap" element={<HeatmapPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/admin" replace />} />
          </Routes>
        </AdminAuthProvider>
      } />

      <Route path="/student/*" element={<StudentApp />} />
    </Routes>
  )
}
