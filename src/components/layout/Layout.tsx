import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Menu } from 'lucide-react'
import Sidebar from './Sidebar'

const SIDEBAR_W = 240
const SIDEBAR_COLLAPSED_W = 64

function useIsMobile() {
  const [v, set] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const h = (e: MediaQueryListEvent) => set(e.matches)
    mq.addEventListener('change', h)
    return () => mq.removeEventListener('change', h)
  }, [])
  return v
}

export default function Layout() {
  const isMobile = useIsMobile()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('sidebar-collapsed') === 'true'
  )
  const [mobileOpen, setMobileOpen] = useState(false)

  function toggle() {
    setCollapsed(prev => {
      const next = !prev
      localStorage.setItem('sidebar-collapsed', String(next))
      return next
    })
  }

  const ml = isMobile ? 0 : (collapsed ? SIDEBAR_COLLAPSED_W : SIDEBAR_W)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile top bar */}
      <header
        className="fixed top-0 inset-x-0 h-14 z-20 flex items-center gap-3 px-4 md:hidden"
        style={{ backgroundColor: '#1b2b44' }}
      >
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center justify-center w-9 h-9 rounded-lg transition-colors cursor-pointer"
          style={{ color: 'rgba(255,255,255,0.65)' }}
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
        <span className="text-[15px] font-bold text-white tracking-tight">Gestión Aula</span>
      </header>

      <Sidebar
        collapsed={collapsed}
        onToggle={toggle}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <main
        className="min-h-screen px-4 pt-[72px] pb-6 md:p-8 md:pt-8"
        style={{
          marginLeft: ml,
          transition: 'margin-left 0.25s ease',
        }}
      >
        <Outlet />
      </main>
      <Toaster richColors position="bottom-right" />
    </div>
  )
}
