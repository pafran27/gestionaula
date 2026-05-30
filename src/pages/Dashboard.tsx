import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { supabase } from '../lib/supabase'
import { Users, ClipboardCheck, BarChart3, Star, CalendarX, CheckCircle2, XCircle, AlertCircle } from 'lucide-react'

interface DashboardData {
  totalAlumnos: number
  asistenciaHoy: { presentes: number; ausentes: number; justificados: number; total: number }
  tomadaHoy: boolean
  diaNoHabil: string | null
}

export default function Dashboard() {
  const today = format(new Date(), 'yyyy-MM-dd')
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const [alumnosRes, asistenciasRes, diaRes] = await Promise.all([
        supabase.from('alumnos').select('id', { count: 'exact', head: true }),
        supabase.from('asistencias').select('estado').eq('fecha', today),
        supabase.from('dias_no_habiles').select('descripcion, motivo').eq('fecha', today).maybeSingle(),
      ])

      const asistencias = asistenciasRes.data ?? []
      setData({
        totalAlumnos: alumnosRes.count ?? 0,
        asistenciaHoy: {
          presentes: asistencias.filter(a => a.estado === 'presente').length,
          ausentes: asistencias.filter(a => a.estado === 'ausente').length,
          justificados: asistencias.filter(a => a.estado === 'ausente_justificado').length,
          total: asistencias.length,
        },
        tomadaHoy: asistencias.length > 0,
        diaNoHabil: diaRes.data ? (diaRes.data.descripcion || diaRes.data.motivo) : null,
      })
      setLoading(false)
    }
    fetchData()
  }, [])

  const fechaFormateada = format(new Date(), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })

  if (loading) return <div className="text-center py-12 text-slate-400 text-sm">Cargando...</div>

  const pct = data && data.totalAlumnos > 0
    ? Math.round((data.asistenciaHoy.presentes / data.totalAlumnos) * 100)
    : 0

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight capitalize">{fechaFormateada}</h1>
        <p className="text-sm text-slate-500 mt-1">Panel de inicio</p>
      </div>

      {data?.diaNoHabil && (
        <div className="bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-r-xl px-4 py-3 text-sm font-medium">
          Hoy es un día no hábil: <strong>{data.diaNoHabil}</strong>
        </div>
      )}

      {/* KPI principales */}
      <div className="grid grid-cols-2 gap-3 sm:gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Alumnos registrados</p>
              <div className="text-2xl sm:text-4xl font-bold text-slate-900">{data?.totalAlumnos}</div>
            </div>
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <Users size={18} className="text-blue-600" strokeWidth={1.75} />
            </div>
          </div>
          <Link to="/alumnos" className="text-xs text-blue-600 hover:text-blue-700 font-semibold mt-3 sm:mt-4 inline-block">
            Ver alumnos →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Asistencia de hoy</p>
              <div className={`text-base sm:text-2xl font-bold leading-tight ${data?.tomadaHoy ? 'text-emerald-600' : 'text-slate-400'}`}>
                {data?.tomadaHoy ? 'Registrada' : 'Pendiente'}
              </div>
            </div>
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 ${data?.tomadaHoy ? 'bg-emerald-50' : 'bg-slate-100'}`}>
              <ClipboardCheck size={18} className={data?.tomadaHoy ? 'text-emerald-600' : 'text-slate-400'} strokeWidth={1.75} />
            </div>
          </div>
          <Link to="/asistencia" className="text-xs text-blue-600 hover:text-blue-700 font-semibold mt-3 sm:mt-4 inline-block">
            {data?.tomadaHoy ? 'Ver o modificar →' : 'Tomar asistencia →'}
          </Link>
        </div>
      </div>

      {/* Detalle de asistencia de hoy */}
      {data?.tomadaHoy && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-4 sm:mb-5">Asistencia de hoy</p>
          <div className="grid grid-cols-3 gap-2 md:gap-4 mb-5">
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle2 size={18} className="text-emerald-600" strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">{data.asistenciaHoy.presentes}</div>
                <div className="text-xs text-slate-500">Presentes</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3">
              <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                <XCircle size={18} className="text-red-500" strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">{data.asistenciaHoy.ausentes}</div>
                <div className="text-xs text-slate-500">Ausentes</div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <AlertCircle size={18} className="text-amber-500" strokeWidth={1.75} />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-slate-900">{data.asistenciaHoy.justificados}</div>
                <div className="text-xs text-slate-500">Justificados</div>
              </div>
            </div>
          </div>
          {data.totalAlumnos > 0 && (
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Asistencia</span>
                <span className="font-semibold text-slate-700">{pct}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Accesos rápidos */}
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Acceso rápido</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { to: '/estadisticas', Icon: BarChart3, label: 'Estadísticas', color: 'bg-violet-50 text-violet-600' },
            { to: '/competencias', Icon: Star, label: 'Competencias', color: 'bg-amber-50 text-amber-600' },
            { to: '/dias-no-habiles', Icon: CalendarX, label: 'Días no hábiles', color: 'bg-rose-50 text-rose-600' },
          ].map(({ to, Icon, label, color }) => (
            <Link
              key={to}
              to={to}
              className="bg-white border border-slate-200/80 rounded-2xl p-4 flex flex-col items-center gap-3 hover:bg-slate-50 transition-colors"
              style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                <Icon size={20} strokeWidth={1.75} />
              </div>
              <span className="text-xs font-semibold text-slate-700">{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
