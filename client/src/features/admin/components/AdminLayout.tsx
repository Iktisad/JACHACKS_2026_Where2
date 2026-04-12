import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminBottomNav } from './AdminBottomNav';
import { useIsDesktop } from '../../../student/hooks/useMediaQuery';

export function AdminLayout() {
  const isDesktop = useIsDesktop();

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'var(--font-family)' }}>
      {isDesktop && <AdminSidebar />}

      <main className={`flex-1 ${isDesktop ? '' : 'pb-20'} overflow-x-hidden`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <Outlet />
        </div>
      </main>

      {!isDesktop && <AdminBottomNav />}
    </div>
  );
}
