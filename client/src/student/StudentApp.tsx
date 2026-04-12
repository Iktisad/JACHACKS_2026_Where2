import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, GuestRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { SpaceDetail } from './pages/SpaceDetail';
import { MapView } from './pages/MapView';
import { Session } from './pages/Session';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';
import { Preferences } from './pages/Preferences';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

export function StudentApp() {
  return (
    <AuthProvider>
      <Routes>
        {/* Guest-only auth routes */}
        <Route element={<GuestRoute />}>
          <Route path="login"    element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>

        {/* Protected app routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index           element={<Home />} />
            <Route path="space/:id" element={<SpaceDetail />} />
            <Route path="map"       element={<MapView />} />
            <Route path="session"   element={<Session />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="profile"   element={<Profile />} />
            <Route path="preferences" element={<Preferences />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/student" replace />} />
      </Routes>
    </AuthProvider>
  );
}
