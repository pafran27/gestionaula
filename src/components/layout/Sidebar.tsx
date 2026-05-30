import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Home, Users, ClipboardCheck, CalendarX, BarChart3, BookOpen, Star,
  ChevronLeft, ChevronRight, X,
} from 'lucide-react'

const navItems = [
  { to: '/', label: 'Inicio', Icon: Home },
  { to: '/alumnos', label: 'Alumnos', Icon: Users },
  { to: '/asistencia', label: 'Asistencia', Icon: ClipboardCheck },
  { to: '/dias-no-habiles', label: 'Días no hábiles', Icon: CalendarX },
  { to: '/estadisticas', label: 'Estadísticas', Icon: BarChart3 },
  { to: '/calificaciones', label: 'Calificaciones', Icon: BookOpen },
  { to: '/competencias', label: 'Competencias', Icon: Star },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  isMobile: boolean
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function Sidebar({ collapsed, onToggle, isMobile, mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation()

  useEffect(() => {
    if (isMobile) onMobileClose()
  }, [location.pathname])

  const showExpanded = isMobile || !collapsed
  const width = isMobile ? 240 : (collapsed ? 64 : 240)
  const transform = isMobile
    ? (mobileOpen ? 'translateX(0)' : 'translateX(-240px)')
    : 'translateX(0)'

  return (
    <aside
      className="fixed top-0 left-0 h-screen flex flex-col z-40 overflow-hidden"
      style={{
        backgroundColor: '#1b2b44',
        width,
        transform,
        transition: 'width 0.25s ease, transform 0.25s ease',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center shrink-0"
        style={{
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          minHeight: 64,
          padding: showExpanded ? '0 16px' : '0',
          justifyContent: showExpanded ? 'space-between' : 'center',
        }}
      >
        {showExpanded && (
          <div className="overflow-hidden">
            <h1 className="text-[15px] font-bold text-white tracking-tight leading-tight whitespace-nowrap">
              Gestión Aula
            </h1>
            <p className="text-[11px] mt-0.5 whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.38)' }}>
              EPEP N° 120 · Mayor Villafañe
            </p>
          </div>
        )}
        {isMobile ? (
          <button
            onClick={onMobileClose}
            className="flex items-center justify-center rounded-lg transition-colors shrink-0 cursor-pointer"
            style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.45)' }}
          >
            <X size={18} strokeWidth={1.75} />
          </button>
        ) : (
          <button
            onClick={onToggle}
            className="flex items-center justify-center rounded-lg transition-colors shrink-0 cursor-pointer"
            style={{ width: 32, height: 32, color: 'rgba(255,255,255,0.45)', backgroundColor: 'transparent' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            {collapsed
              ? <ChevronRight size={16} strokeWidth={1.75} />
              : <ChevronLeft size={16} strokeWidth={1.75} />
            }
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
        <ul className={`space-y-0.5 ${showExpanded ? 'px-3' : 'px-1.5'}`}>
          {navItems.map(({ to, label, Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/'}
                title={!showExpanded ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center transition-colors rounded-lg text-[13px] font-medium ${
                    showExpanded ? 'gap-3 px-3 py-2.5' : 'justify-center p-2.5'
                  } ${
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:bg-white/10 hover:text-white'
                  }`
                }
              >
                <Icon size={showExpanded ? 16 : 18} strokeWidth={1.75} />
                {showExpanded && <span className="whitespace-nowrap">{label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer */}
      {showExpanded && (
        <div
          className="px-5 py-4 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          <p className="text-[11px] whitespace-nowrap" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Formosa · {new Date().getFullYear()}
          </p>
        </div>
      )}
    </aside>
  )
}
