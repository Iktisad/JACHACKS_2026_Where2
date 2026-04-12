import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { DesktopSidebar } from './DesktopSidebar';
import { useIsDesktop } from '../hooks/useMediaQuery';

export function Layout() {
  const isDesktop = useIsDesktop();

  return (
    <div className="min-h-screen flex" style={{ fontFamily: 'var(--font-family)' }}>
      {isDesktop && <DesktopSidebar />}

      <main className={`flex-1 ${isDesktop ? '' : 'pb-24'} overflow-x-hidden`}>
        <Outlet />
      </main>

      {!isDesktop && <BottomNav />}
    </div>
  );
}
