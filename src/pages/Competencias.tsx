import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Printer, Download, X } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../lib/supabase'
import { Alumno, CompetenciaSocioafectiva, ValorCompetencia, Trimestre } from '../types'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'

const TRIMESTRES: { value: Trimestre; label: string }[] = [
  { value: 'T1', label: '1° Trimestre' },
  { value: 'T2', label: '2° Trimestre' },
  { value: 'T3', label: '3° Trimestre' },
]

const VALORES: { value: ValorCompetencia; label: string; activeClass: string }[] = [
  { value: 'regular', label: 'Regular', activeClass: 'bg-red-50 text-red-700 border-red-300 font-semibold' },
  { value: 'buena', label: 'Buena', activeClass: 'bg-amber-50 text-amber-700 border-amber-300 font-semibold' },
  { value: 'muy_buena', label: 'Muy buena', activeClass: 'bg-emerald-50 text-emerald-700 border-emerald-300 font-semibold' },
]

const selectClass = 'border border-slate-300 rounded-[10px] px-3 h-[42px] text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition-colors'

const valorLabel: Record<ValorCompetencia, string> = {
  regular: 'Regular',
  buena: 'Buena',
  muy_buena: 'Muy buena',
}

function generarHTMLCompetencias(
  alumnos: Alumno[],
  competencias: Record<string, ValorCompetencia>,
  trimestre: Trimestre,
  anio: number,
  filtroAlumnoId: string,
): string {
  const trimestreLabel = TRIMESTRES.find(t => t.value === trimestre)?.label ?? trimestre
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  const target = filtroAlumnoId === 'todos' ? alumnos : alumnos.filter(a => a.id === filtroAlumnoId)

  const rows = target.map(a => {
    const v = competencias[a.id]
    return `<tr>
      <td>${a.apellido}, ${a.nombre}</td>
      <td class="valor ${v ?? ''}">${v ? valorLabel[v] : '—'}</td>
    </tr>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Competencias · ${trimestreLabel} ${anio}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #111; padding: 32px; font-size: 13px; }
    .doc-header { border-bottom: 2px solid #1b2b44; padding-bottom: 16px; margin-bottom: 24px; }
    .doc-header h1 { font-size: 18px; font-weight: 700; color: #1b2b44; }
    .doc-header h2 { font-size: 14px; font-weight: 600; color: #374151; margin-top: 4px; }
    .doc-meta { margin-top: 8px; display: flex; gap: 24px; flex-wrap: wrap; }
    .doc-meta span { font-size: 12px; color: #6b7280; }
    .doc-meta strong { color: #374151; }
    .fecha-impresion { font-size: 11px; color: #9ca3af; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f1f5f9; text-align: left; padding: 7px 12px; font-weight: 600; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; border: 1px solid #e2e8f0; }
    td { padding: 7px 12px; border: 1px solid #e2e8f0; color: #374151; }
    .valor { font-weight: 600; text-align: center; }
    .regular { color: #b91c1c; }
    .buena { color: #92400e; }
    .muy_buena { color: #065f46; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="doc-header">
    <h1>Competencias socioafectivas</h1>
    <h2>${trimestreLabel} ${anio}</h2>
    <div class="doc-meta">
      ${filtroAlumnoId !== 'todos' ? `<span>Alumno: <strong>${target[0] ? `${target[0].apellido}, ${target[0].nombre}` : '—'}</strong></span>` : ''}
    </div>
    <div class="fecha-impresion">Generado el ${fecha}</div>
  </div>
  <table>
    <thead><tr><th>Alumno</th><th>Competencia socioafectiva</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`
}

function generarPDFCompetencias(
  alumnos: Alumno[],
  competencias: Record<string, ValorCompetencia>,
  trimestre: Trimestre,
  anio: number,
  filtroAlumnoId: string,
) {
  const trimestreLabel = TRIMESTRES.find(t => t.value === trimestre)?.label ?? trimestre
  const target = filtroAlumnoId === 'todos' ? alumnos : alumnos.filter(a => a.id === filtroAlumnoId)

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

  let y = 20
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(27, 43, 68)
  doc.text('Competencias socioafectivas', 14, y)
  y += 7
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(55, 65, 81)
  doc.text(`${trimestreLabel} ${anio}`, 14, y)
  y += 5
  doc.setFontSize(9)
  doc.setTextColor(156, 163, 175)
  doc.text(`Generado el ${fecha}`, 14, y)
  y += 8

  autoTable(doc, {
    startY: y,
    head: [['Alumno', 'Competencia socioafectiva']],
    body: target.map(a => {
      const v = competencias[a.id]
      return [`${a.apellido}, ${a.nombre}`, v ? valorLabel[v] : '—']
    }),
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: 'bold', fontSize: 9 },
    columnStyles: { 1: { halign: 'center', fontStyle: 'bold' } },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  const slug = filtroAlumnoId === 'todos' ? 'todos' : target[0] ? `${target[0].apellido}_${target[0].nombre}`.toLowerCase().replace(/\s+/g, '_') : 'alumno'
  doc.save(`competencias_${slug}_${trimestre}_${anio}.pdf`)
}

export default function Competencias() {
  const anioActual = new Date().getFullYear()
  const [anio, setAnio] = useState(anioActual)
  const [trimestre, setTrimestre] = useState<Trimestre>('T1')
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [competencias, setCompetencias] = useState<Record<string, ValorCompetencia>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [printAlumno, setPrintAlumno] = useState<string>('todos')

  useEffect(() => { fetchData() }, [anio, trimestre])

  async function fetchData() {
    setLoading(true)
    const periodo = `${anio}-${trimestre}`

    const [alumnosRes, compRes] = await Promise.all([
      supabase.from('alumnos').select('*').order('apellido'),
      supabase.from('competencias_socioafectivas').select('*').eq('periodo', periodo),
    ])

    if (alumnosRes.error) { toast.error('Error al cargar'); setLoading(false); return }

    setAlumnos(alumnosRes.data ?? [])

    const mapa: Record<string, ValorCompetencia> = {}
    ;(compRes.data ?? []).forEach((c: CompetenciaSocioafectiva) => {
      mapa[c.alumno_id] = c.valor
    })
    setCompetencias(mapa)
    setLoading(false)
  }

  function setValor(alumnoId: string, valor: ValorCompetencia) {
    setCompetencias(prev => ({ ...prev, [alumnoId]: valor }))
  }

  function handleImprimir() {
    const html = generarHTMLCompetencias(alumnos, competencias, trimestre, anio, printAlumno)
    const win = window.open('', '_blank', 'width=900,height=700')
    win?.document.write(html)
    win?.document.close()
    setShowPrint(false)
  }

  function handleDescargarPDF() {
    generarPDFCompetencias(alumnos, competencias, trimestre, anio, printAlumno)
    setShowPrint(false)
  }

  function handleCompartirWhatsApp() {
    const trimestreLabel = TRIMESTRES.find(t => t.value === trimestre)?.label ?? trimestre
    const target = printAlumno === 'todos' ? alumnos : alumnos.filter(a => a.id === printAlumno)
    const lineas = target.map(a => {
      const v = competencias[a.id]
      return `• ${a.apellido}, ${a.nombre}: ${v ? valorLabel[v] : '—'}`
    }).join('\n')
    const texto = `*Competencias Socioafectivas*\n*${trimestreLabel} ${anio}*\n\n${lineas}`
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
    setShowPrint(false)
  }

  async function handleGuardar() {
    setSaving(true)
    const periodo = `${anio}-${trimestre}`
    const registros = Object.entries(competencias).map(([alumno_id, valor]) => ({
      alumno_id,
      periodo,
      valor,
    }))

    const { error } = await supabase
      .from('competencias_socioafectivas')
      .upsert(registros, { onConflict: 'alumno_id,periodo' })

    if (error) {
      toast.error('Error al guardar')
    } else {
      toast.success('Competencias guardadas')
    }
    setSaving(false)
  }

  const periodo = `${anio}-${trimestre}`
  const yaHayDatos = Object.keys(competencias).length > 0

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Competencias socioafectivas</h1>
          <p className="text-sm text-slate-500 mt-1">Registro trimestral por alumno</p>
        </div>
        {alumnos.length > 0 && (
          <Button variant="secondary" onClick={() => { setPrintAlumno('todos'); setShowPrint(true) }}>
            <Printer size={15} strokeWidth={1.75} />
            Imprimir
          </Button>
        )}
      </div>

      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Año</label>
          <select value={anio} onChange={e => setAnio(Number(e.target.value))} className={selectClass}>
            {[anioActual - 1, anioActual, anioActual + 1].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Trimestre</label>
          <select value={trimestre} onChange={e => setTrimestre(e.target.value as Trimestre)} className={selectClass}>
            {TRIMESTRES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <Card title={`${TRIMESTRES.find(t => t.value === trimestre)?.label} ${anio}`}>
        {yaHayDatos && (
          <div className="mb-5 bg-blue-50 border-l-4 border-blue-500 text-blue-800 rounded-r-xl px-4 py-2.5 text-sm font-medium">
            Ya hay competencias cargadas para este período. Podés modificarlas.
          </div>
        )}

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Cargando...</div>
        ) : alumnos.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">No hay alumnos registrados</div>
        ) : (
          <div className="space-y-2">
            {alumnos.map(alumno => {
              const valorActual = competencias[alumno.id]
              return (
                <div key={alumno.id} className="flex flex-col md:flex-row md:items-center md:justify-between px-4 py-3 gap-2 rounded-xl border border-slate-100 hover:bg-slate-50/60 transition-colors">
                  <span className="text-sm font-medium text-slate-800 md:w-48 md:shrink-0">
                    {alumno.apellido}, {alumno.nombre}
                  </span>
                  <div className="flex gap-2">
                    {VALORES.map(v => (
                      <button
                        key={v.value}
                        onClick={() => setValor(alumno.id, v.value)}
                        className={`flex-1 md:flex-none px-3 py-1.5 rounded-full text-xs border transition-colors cursor-pointer ${
                          valorActual === v.value
                            ? v.activeClass
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {alumnos.length > 0 && (
        <Button onClick={handleGuardar} loading={saving}>
          Guardar competencias — {periodo}
        </Button>
      )}

      {/* Modal imprimir */}
      {showPrint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">Opciones de impresión</h2>
              <button onClick={() => setShowPrint(false)} className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Alumno</label>
                <select
                  value={printAlumno}
                  onChange={e => setPrintAlumno(e.target.value)}
                  className={selectClass}
                >
                  <option value="todos">Todos los alumnos</option>
                  {alumnos.map(a => (
                    <option key={a.id} value={a.id}>{a.apellido}, {a.nombre}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-slate-400">
                Se abrirá una ventana con el formato de impresión listo para imprimir o guardar como PDF.
              </p>
            </div>
            <div className="flex gap-2 px-5 pb-5 pt-2 flex-wrap">
              <Button variant="secondary" onClick={handleDescargarPDF}>
                <Download size={14} strokeWidth={1.75} />
                Descargar PDF
              </Button>
              <Button variant="secondary" onClick={handleImprimir}>
                <Printer size={14} strokeWidth={1.75} />
                Imprimir
              </Button>
              <button
                onClick={handleCompartirWhatsApp}
                className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold border transition-colors cursor-pointer bg-[#25D366] text-white border-[#25D366] hover:bg-[#1ebe5d]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
