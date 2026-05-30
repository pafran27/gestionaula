import { useEffect, useState } from 'react'
import { format, getDaysInMonth, isWeekend } from 'date-fns'
import { supabase } from '../lib/supabase'
import { Alumno, Asistencia } from '../types'
import Card from '../components/ui/Card'
import { toast } from 'sonner'

interface EstadisticaAlumno {
  alumno: Alumno
  diasPresentes: number
  diasAusentes: number
  diasJustificados: number
  diasHabiles: number
  diasClase: number
  porcentaje: number
  asistenciaMedia: number
}

interface ResumenGrupo {
  cantidad: number
  posiblesPresencias: number
  porcentaje: number
  mediaXAlumno: number
  totalPresentes: number
  totalAusentes: number
  totalJustificados: number
}

const MESES = [
  { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
  { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
  { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
  { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
]

function calcularDiasHabilesDelMes(anio: number, mes: number, noHabiles: Set<string>, feriados: Set<string>): number {
  const total = getDaysInMonth(new Date(anio, mes - 1))
  let habiles = 0
  for (let d = 1; d <= total; d++) {
    const fecha = new Date(anio, mes - 1, d)
    const fechaStr = format(fecha, 'yyyy-MM-dd')
    if (!isWeekend(fecha) && !noHabiles.has(fechaStr) && !feriados.has(fechaStr)) habiles++
  }
  return habiles
}

function resumenGrupo(lista: EstadisticaAlumno[]): ResumenGrupo | null {
  if (lista.length === 0) return null
  const totalPresentes = lista.reduce((a, s) => a + s.diasPresentes, 0)
  const diasHabiles = lista[0]?.diasHabiles ?? 0
  const posiblesPresencias = diasHabiles * lista.length
  return {
    cantidad: lista.length,
    posiblesPresencias,
    porcentaje: posiblesPresencias > 0 ? parseFloat(((totalPresentes / lista.length) * 100 / diasHabiles).toFixed(2)) : 0,
    mediaXAlumno: posiblesPresencias > 0 ? parseFloat((totalPresentes / diasHabiles / lista.length).toFixed(2)) : 0,
    totalPresentes,
    totalAusentes: lista.reduce((a, s) => a + s.diasAusentes, 0),
    totalJustificados: lista.reduce((a, s) => a + s.diasJustificados, 0),
  }
}

function colorPorcentaje(p: number) {
  return p >= 85 ? 'text-emerald-600' : p >= 70 ? 'text-amber-500' : 'text-red-500'
}

function barraColor(p: number) {
  return p >= 85 ? 'bg-emerald-500' : p >= 70 ? 'bg-amber-400' : 'bg-red-400'
}

function BarraAsistencia({ porcentaje }: { porcentaje: number }) {
  return (
    <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5">
      <div className={`h-1.5 rounded-full ${barraColor(porcentaje)}`} style={{ width: `${Math.min(porcentaje, 100)}%` }} />
    </div>
  )
}

function PanelGenero({ titulo, colorClass, barraClass, resumen }: {
  titulo: string
  colorClass: string
  barraClass: string
  resumen: ResumenGrupo | null
}) {
  if (!resumen) return (
    <Card className="flex-1">
      <p className={`text-xs font-semibold uppercase tracking-wide ${colorClass} mb-3`}>{titulo}</p>
      <p className="text-xs text-slate-400">Sin datos</p>
    </Card>
  )
  return (
    <Card className="flex-1">
      <p className={`text-xs font-semibold uppercase tracking-wide ${colorClass} mb-4`}>
        {titulo} — {resumen.cantidad} alumno{resumen.cantidad !== 1 ? 's' : ''}
      </p>
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs text-slate-500">Asistencia grupal</span>
              <p className="text-xs text-slate-400">{resumen.totalPresentes} de {resumen.posiblesPresencias} posibles</p>
            </div>
            <span className={`text-2xl font-bold ${colorPorcentaje(resumen.porcentaje)}`}>{resumen.porcentaje}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5">
            <div className={`h-1.5 rounded-full ${barraClass}`} style={{ width: `${Math.min(resumen.porcentaje, 100)}%` }} />
          </div>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Asistencia media</span>
          <span className="font-semibold text-slate-700">{resumen.mediaXAlumno}</span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100">
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-600">{resumen.totalPresentes}</div>
            <div className="text-xs text-slate-400">Presencias</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-500">{resumen.totalAusentes}</div>
            <div className="text-xs text-slate-400">Ausencias</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-amber-500">{resumen.totalJustificados}</div>
            <div className="text-xs text-slate-400">Justif.</div>
          </div>
        </div>
      </div>
    </Card>
  )
}

const selectClass = 'border border-slate-300 rounded-[10px] px-3 h-[42px] text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition-colors'

export default function Estadisticas() {
  const hoy = new Date()
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const [stats, setStats] = useState<EstadisticaAlumno[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => { fetchStats() }, [anio, mes])

  async function fetchStats() {
    setLoading(true)

    const mesStr = String(mes).padStart(2, '0')
    const desde = `${anio}-${mesStr}-01`
    const hasta = `${anio}-${mesStr}-${getDaysInMonth(new Date(anio, mes - 1))}`

    const [feriadosRes, alumnosRes, asistenciasRes, noHabilesRes] = await Promise.all([
      fetch(`https://api.argentinadatos.com/v1/feriados/${anio}`)
        .then(r => r.json() as Promise<{ fecha: string }[]>)
        .catch(() => [] as { fecha: string }[]),
      supabase.from('alumnos').select('*').order('apellido'),
      supabase.from('asistencias').select('*').gte('fecha', desde).lte('fecha', hasta),
      supabase.from('dias_no_habiles').select('fecha').gte('fecha', desde).lte('fecha', hasta),
    ])

    if (alumnosRes.error || asistenciasRes.error) {
      toast.error('Error al cargar estadísticas')
      setLoading(false)
      return
    }

    const feriadosSet = new Set<string>(feriadosRes.map(f => f.fecha))
    const noHabilesSet = new Set<string>((noHabilesRes.data ?? []).map(d => d.fecha))
    const diasHabiles = calcularDiasHabilesDelMes(anio, mes, noHabilesSet, feriadosSet)

    const asistenciasPorAlumno: Record<string, Asistencia[]> = {}
    ;(asistenciasRes.data ?? []).forEach(a => {
      if (!asistenciasPorAlumno[a.alumno_id]) asistenciasPorAlumno[a.alumno_id] = []
      asistenciasPorAlumno[a.alumno_id].push(a as Asistencia)
    })

    const resultado: EstadisticaAlumno[] = (alumnosRes.data ?? []).map(alumno => {
      const asistencias = asistenciasPorAlumno[alumno.id] ?? []
      const asistenciasEscolares = asistencias.filter(a => {
        const d = new Date(a.fecha + 'T00:00:00')
        return !isWeekend(d) && !feriadosSet.has(a.fecha) && !noHabilesSet.has(a.fecha)
      })

      const presentes = asistenciasEscolares.filter(a => a.estado === 'presente').length
      const ausentes = asistenciasEscolares.filter(a => a.estado === 'ausente').length
      const justificados = asistenciasEscolares.filter(a => a.estado === 'ausente_justificado').length
      const porcentaje = diasHabiles > 0 ? Math.round((presentes / diasHabiles) * 100) : 0
      const asistenciaMedia = diasHabiles > 0 ? parseFloat((presentes / diasHabiles).toFixed(2)) : 0

      return {
        alumno: alumno as Alumno,
        diasPresentes: presentes,
        diasAusentes: ausentes,
        diasJustificados: justificados,
        diasHabiles,
        diasClase: asistenciasEscolares.length,
        porcentaje,
        asistenciaMedia,
      }
    })

    setStats(resultado)
    setLoading(false)
  }

  const statsVarones = stats.filter(s => s.alumno.sexo === 'M')
  const statsMujeres = stats.filter(s => s.alumno.sexo === 'F')
  const statsOtros = stats.filter(s => s.alumno.sexo !== 'M' && s.alumno.sexo !== 'F')

  const resumenVarones = resumenGrupo(statsVarones)
  const resumenMujeres = resumenGrupo(statsMujeres)

  const totalAlumnos = stats.length
  const diasHabilesDelMes = stats[0]?.diasHabiles ?? 0
  const totalPresentesGeneral = stats.reduce((acc, s) => acc + s.diasPresentes, 0)

  const promedioGeneral = diasHabilesDelMes > 0 && totalAlumnos > 0
    ? parseFloat(((totalPresentesGeneral / totalAlumnos) * 100 / diasHabilesDelMes).toFixed(2))
    : 0
  const mediaXAlumnoGeneral = diasHabilesDelMes > 0 && totalAlumnos > 0
    ? parseFloat((totalPresentesGeneral / diasHabilesDelMes / totalAlumnos).toFixed(2))
    : 0

  const mesLabel = MESES.find(m => m.value === mes)?.label ?? ''

  return (
    <div className="space-y-7">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Estadísticas</h1>
        <p className="text-sm text-slate-500 mt-1">Resumen de asistencia mensual</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 items-end">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Mes</label>
          <select value={mes} onChange={e => setMes(Number(e.target.value))} className={selectClass}>
            {MESES.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Año</label>
          <select value={anio} onChange={e => setAnio(Number(e.target.value))} className={selectClass}>
            {[anio - 1, anio, anio + 1].map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
      </div>

      {/* Resumen general */}
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Resumen general</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="text-center">
            <div className="text-3xl font-bold text-slate-900">{totalAlumnos}</div>
            <div className="text-xs text-slate-500 mt-1">Total alumnos</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-slate-900">{diasHabilesDelMes}</div>
            <div className="text-xs text-slate-500 mt-1">Días hábiles</div>
          </Card>
          <Card className="text-center">
            <div className={`text-3xl font-bold ${colorPorcentaje(promedioGeneral)}`}>{promedioGeneral}%</div>
            <div className="text-xs text-slate-500 mt-1">Asistencia general</div>
            <BarraAsistencia porcentaje={promedioGeneral} />
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-600">{mediaXAlumnoGeneral}</div>
            <div className="text-xs text-slate-500 mt-1">Asistencia media</div>
          </Card>
        </div>
      </div>

      {/* Por género */}
      <div>
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Por género</p>
        <div className="flex flex-col sm:flex-row gap-4">
          <PanelGenero titulo="Varones" colorClass="text-blue-700" barraClass="bg-blue-500" resumen={resumenVarones} />
          <PanelGenero titulo="Mujeres" colorClass="text-pink-700" barraClass="bg-pink-400" resumen={resumenMujeres} />
          {statsOtros.length > 0 && (
            <PanelGenero titulo="Otro" colorClass="text-violet-700" barraClass="bg-violet-400" resumen={resumenGrupo(statsOtros)} />
          )}
        </div>
      </div>

      {/* Comparativa */}
      {resumenVarones && resumenMujeres && (
        <Card>
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-wide mb-4">Comparativa varones vs. mujeres</p>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                <span>Varones ({resumenVarones.porcentaje}%)</span>
                <span>Mujeres ({resumenMujeres.porcentaje}%)</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-slate-100 mb-1">
                <div className="bg-blue-500 h-full" style={{ width: `${resumenVarones.porcentaje}%` }} />
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-slate-100">
                <div className="bg-pink-400 h-full" style={{ width: `${resumenMujeres.porcentaje}%` }} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-600 pt-3 border-t border-slate-100">
              <div className="space-y-1">
                <p className="font-semibold text-blue-700 uppercase tracking-wide">Varones</p>
                <p>Asistencia media: <strong>{resumenVarones.mediaXAlumno}</strong></p>
                <p>Ausencias totales: <strong className="text-red-500">{resumenVarones.totalAusentes}</strong></p>
                <p>Justificadas: <strong className="text-amber-600">{resumenVarones.totalJustificados}</strong></p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-pink-700 uppercase tracking-wide">Mujeres</p>
                <p>Asistencia media: <strong>{resumenMujeres.mediaXAlumno}</strong></p>
                <p>Ausencias totales: <strong className="text-red-500">{resumenMujeres.totalAusentes}</strong></p>
                <p>Justificadas: <strong className="text-amber-600">{resumenMujeres.totalJustificados}</strong></p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Detalle por alumno */}
      <Card title={`Detalle por alumno — ${mesLabel} ${anio}`}>
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Calculando...</div>
        ) : stats.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No hay datos para este período</div>
        ) : (
          <>
          {/* Tarjetas mobile */}
          <div className="md:hidden space-y-2">
            {stats.map(({ alumno, diasClase, diasPresentes, diasAusentes, diasJustificados, porcentaje }) => (
              <div key={alumno.id} className="flex flex-col gap-2 px-4 py-3 rounded-xl border border-slate-100 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ${alumno.sexo === 'M' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                      {alumno.sexo === 'M' ? 'V' : 'M'}
                    </span>
                    <span className="font-medium text-slate-800 text-sm truncate">{alumno.apellido}, {alumno.nombre}</span>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ml-2 ${colorPorcentaje(porcentaje)}`}>{porcentaje}%</span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-center">
                  <div>
                    <div className="text-sm font-semibold text-slate-700">{diasClase}</div>
                    <div className="text-[10px] text-slate-400">Clase</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-emerald-600">{diasPresentes}</div>
                    <div className="text-[10px] text-slate-400">Pres.</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-red-500">{diasAusentes}</div>
                    <div className="text-[10px] text-slate-400">Aus.</div>
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-amber-500">{diasJustificados}</div>
                    <div className="text-[10px] text-slate-400">Just.</div>
                  </div>
                </div>
                <BarraAsistencia porcentaje={porcentaje} />
              </div>
            ))}
          </div>

          {/* Tabla desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-slate-100">
                  <th className="pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Alumno</th>
                  <th className="pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-center">Días clase</th>
                  <th className="pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-center">Presentes</th>
                  <th className="pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-center">Ausentes</th>
                  <th className="pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-center">Justif.</th>
                  <th className="pb-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wide text-center">% Asistencia</th>
                </tr>
              </thead>
              <tbody>
                {stats.map(({ alumno, diasClase, diasPresentes, diasAusentes, diasJustificados, porcentaje }) => (
                  <tr key={alumno.id} className="border-b border-slate-50 hover:bg-slate-50/60 transition-colors">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${alumno.sexo === 'M' ? 'bg-blue-50 text-blue-700' : 'bg-pink-50 text-pink-700'}`}>
                          {alumno.sexo === 'M' ? 'V' : 'M'}
                        </span>
                        <span className="font-medium text-slate-800">{alumno.apellido}, {alumno.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center text-slate-600">{diasClase}</td>
                    <td className="py-3 text-center font-medium text-emerald-600">{diasPresentes}</td>
                    <td className="py-3 text-center text-red-500">{diasAusentes}</td>
                    <td className="py-3 text-center text-amber-600">{diasJustificados}</td>
                    <td className="py-3 text-center">
                      <span className={`font-bold ${colorPorcentaje(porcentaje)}`}>{porcentaje}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </Card>

      <p className="text-xs text-slate-400">
        * Asistencia media = días presentes ÷ días hábiles del mes. Ausente y Justificado cuentan igual. Días hábiles excluyen fines de semana, feriados nacionales y días no hábiles programados.
      </p>
    </div>
  )
}
