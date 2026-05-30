import { useEffect, useState } from 'react'
import { format, addDays, subDays } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Alumno, EstadoAsistencia } from '../types'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

type RegistroAsistencia = Record<string, EstadoAsistencia>

const ESTADOS: { value: EstadoAsistencia; label: string; colors: string; activeColors: string }[] = [
  {
    value: 'presente',
    label: 'Presente',
    colors: 'border-slate-200 text-slate-500 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200',
    activeColors: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold',
  },
  {
    value: 'ausente',
    label: 'Ausente',
    colors: 'border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-700 hover:border-red-200',
    activeColors: 'bg-red-50 text-red-700 border-red-300 font-semibold',
  },
  {
    value: 'ausente_justificado',
    label: 'Justificado',
    colors: 'border-slate-200 text-slate-500 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200',
    activeColors: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold',
  },
]

export default function Asistencia() {
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const [fecha, setFecha] = useState(todayStr)
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [registro, setRegistro] = useState<RegistroAsistencia>({})
  const [diaNoHabil, setDiaNoHabil] = useState<string | null>(null)
  const [feriados, setFeriados] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [yaGuardado, setYaGuardado] = useState(false)

  useEffect(() => {
    const anio = new Date().getFullYear()
    fetch(`https://api.argentinadatos.com/v1/feriados/${anio}`)
      .then(r => r.json())
      .then((data: { fecha: string; nombre: string }[]) => {
        setFeriados(new Map(data.map(f => [f.fecha, f.nombre])))
      })
      .catch(() => {})
  }, [])

  useEffect(() => { fetchData() }, [fecha])

  async function fetchData() {
    setLoading(true)

    const [alumnosRes, diaRes, asistenciasRes] = await Promise.all([
      supabase.from('alumnos').select('*').order('apellido'),
      supabase.from('dias_no_habiles').select('*').eq('fecha', fecha).maybeSingle(),
      supabase.from('asistencias').select('*').eq('fecha', fecha),
    ])

    if (alumnosRes.error) { toast.error('Error al cargar alumnos'); setLoading(false); return }

    setAlumnos(alumnosRes.data ?? [])
    setDiaNoHabil(diaRes.data?.descripcion ?? (diaRes.data ? diaRes.data.motivo : null))

    if (asistenciasRes.data && asistenciasRes.data.length > 0) {
      const mapa: RegistroAsistencia = {}
      asistenciasRes.data.forEach(a => { mapa[a.alumno_id] = a.estado as EstadoAsistencia })
      setRegistro(mapa)
      setYaGuardado(true)
    } else {
      const inicial: RegistroAsistencia = {}
      alumnosRes.data?.forEach(a => { inicial[a.id] = 'presente' })
      setRegistro(inicial)
      setYaGuardado(false)
    }

    setLoading(false)
  }

  function setEstado(alumnoId: string, estado: EstadoAsistencia) {
    setRegistro(prev => ({ ...prev, [alumnoId]: estado }))
    setYaGuardado(false)
  }

  function marcarTodos(estado: EstadoAsistencia) {
    const nuevo: RegistroAsistencia = {}
    alumnos.forEach(a => { nuevo[a.id] = estado })
    setRegistro(nuevo)
    setYaGuardado(false)
  }

  async function handleGuardar() {
    setSaving(true)
    try {
      const registros = alumnos.map(a => ({
        alumno_id: a.id,
        fecha,
        estado: registro[a.id] ?? 'presente',
      }))

      const { error } = await supabase
        .from('asistencias')
        .upsert(registros, { onConflict: 'alumno_id,fecha' })

      if (error) throw error
      toast.success('Asistencia guardada correctamente')
      setYaGuardado(true)
    } catch {
      toast.error('Error al guardar la asistencia')
    } finally {
      setSaving(false)
    }
  }

  function cambiarDia(delta: number) {
    let actual = new Date(fecha + 'T00:00:00')
    let intentos = 0
    do {
      actual = delta > 0 ? addDays(actual, 1) : subDays(actual, 1)
      intentos++
    } while ((actual.getDay() === 0 || actual.getDay() === 6) && intentos < 14)
    const nuevaStr = format(actual, 'yyyy-MM-dd')
    if (nuevaStr <= todayStr) setFecha(nuevaStr)
  }

  const diaDeSemana = new Date(fecha + 'T00:00:00').getDay()
  const esFinDeSemana = diaDeSemana === 0 || diaDeSemana === 6
  const nombreFeriado = feriados.get(fecha) ?? null
  const diaNoEscolar = esFinDeSemana || !!nombreFeriado || !!diaNoHabil

  const presentes = Object.values(registro).filter(e => e === 'presente').length
  const ausentes = Object.values(registro).filter(e => e === 'ausente').length
  const justificados = Object.values(registro).filter(e => e === 'ausente_justificado').length
  const esHoy = fecha === todayStr

  const fechaDisplay = format(new Date(fecha + 'T00:00:00'), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })

  if (loading) return <div className="text-center py-12 text-slate-400 text-sm">Cargando...</div>

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Asistencia</h1>
          <p className="text-sm text-slate-500 mt-1 capitalize">{fechaDisplay}</p>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Fecha</label>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => cambiarDia(-1)}
              className="w-9 h-[42px] flex items-center justify-center rounded-[10px] border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              value={fecha}
              max={todayStr}
              onChange={e => setFecha(e.target.value)}
              className="border border-slate-300 rounded-[10px] px-3 h-[42px] text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition-colors"
            />
            <button
              onClick={() => cambiarDia(1)}
              disabled={esHoy}
              className="w-9 h-[42px] flex items-center justify-center rounded-[10px] border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Banners de estado */}
      {!esHoy && (
        <div className="fixed bottom-6 right-6 z-50 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-r-xl px-4 py-3 text-sm font-medium shadow-lg">
          Estás cargando asistencia para una fecha anterior
        </div>
      )}

      {esFinDeSemana && (
        <div className="bg-orange-50 border-l-4 border-orange-400 text-orange-800 rounded-r-xl px-4 py-3 text-sm font-medium">
          Los fines de semana no se registra asistencia
        </div>
      )}

      {!esFinDeSemana && nombreFeriado && (
        <div className="bg-red-50 border-l-4 border-red-400 text-red-800 rounded-r-xl px-4 py-3 text-sm font-medium">
          Feriado nacional: <strong>{nombreFeriado}</strong>. No se registra asistencia.
        </div>
      )}

      {!esFinDeSemana && !nombreFeriado && diaNoHabil && (
        <div className="bg-amber-50 border-l-4 border-amber-400 text-amber-800 rounded-r-xl px-4 py-3 text-sm font-medium">
          Día no hábil: <strong>{diaNoHabil}</strong>. No se registra asistencia.
        </div>
      )}

      {yaGuardado && !diaNoEscolar && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 rounded-r-xl px-4 py-3 text-sm font-medium shadow-lg">
          La asistencia de este día ya fue guardada. Podés modificarla y volver a guardar.
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-3 gap-2 md:gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} className="text-emerald-600" strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-bold text-slate-900">{presentes}</div>
            <div className="text-xs text-slate-500 mt-0.5">Presentes</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
            <XCircle size={18} className="text-red-500" strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-bold text-slate-900">{ausentes}</div>
            <div className="text-xs text-slate-500 mt-0.5">Ausentes</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 sm:p-5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-1 sm:gap-4" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <AlertCircle size={18} className="text-amber-500" strokeWidth={1.75} />
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-bold text-slate-900">{justificados}</div>
            <div className="text-xs text-slate-500 mt-0.5">Justificados</div>
          </div>
        </div>
      </div>

      {/* Lista de alumnos */}
      <Card>
        <div className="mb-5">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block mb-2">Marcar todos:</span>
          <div className="flex gap-2">
            <button
              onClick={() => marcarTodos('presente')}
              className="flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
            >
              Presentes
            </button>
            <button
              onClick={() => marcarTodos('ausente')}
              className="flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
            >
              Ausentes
            </button>
            <button
              onClick={() => marcarTodos('ausente_justificado')}
              className="flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
            >
              <span className="min-[425px]:hidden">Just.</span>
              <span className="hidden min-[425px]:inline">Justificados</span>
            </button>
          </div>
        </div>

        {alumnos.length === 0 ? (
          <div className="text-center py-10 text-slate-400 text-sm">
            No hay alumnos. <a href="/alumnos" className="text-blue-600 underline">Agregar alumnos</a>
          </div>
        ) : (
          <div className="space-y-2">
            {alumnos.map(alumno => {
              const estadoActual = registro[alumno.id] ?? 'presente'
              return (
                <div key={alumno.id} className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 gap-2 rounded-xl border border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <span className="text-sm font-medium text-slate-800 md:w-44 md:shrink-0">
                    {alumno.apellido}, {alumno.nombre}
                  </span>
                  <div className="flex gap-2">
                    {ESTADOS.map(e => (
                      <button
                        key={e.value}
                        onClick={() => setEstado(alumno.id, e.value)}
                        className={`flex-1 md:flex-none px-3 py-1.5 rounded-full text-xs border transition-colors cursor-pointer ${
                          estadoActual === e.value ? e.activeColors : e.colors
                        }`}
                      >
                        {e.value === 'ausente_justificado' ? (
                          <>
                            <span className="min-[425px]:hidden">Just.</span>
                            <span className="hidden min-[425px]:inline">{e.label}</span>
                          </>
                        ) : e.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {alumnos.length > 0 && !diaNoEscolar && (
        <Button onClick={handleGuardar} loading={saving}>
          Guardar asistencia
        </Button>
      )}
    </div>
  )
}
