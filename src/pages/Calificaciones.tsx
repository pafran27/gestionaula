import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { X, Plus, ChevronDown, ChevronUp, Printer, ChevronsUpDown, Download } from 'lucide-react'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { supabase } from '../lib/supabase'
import {
  Alumno, Calificacion, PromedioTrimestre, Trimestre, TipoEvaluacion,
  MATERIAS, Materia,
} from '../types'
import Button from '../components/ui/Button'

const TRIMESTRES: { value: Trimestre; label: string }[] = [
  { value: 'T1', label: '1° Trimestre' },
  { value: 'T2', label: '2° Trimestre' },
  { value: 'T3', label: '3° Trimestre' },
]

const TIPOS: { value: TipoEvaluacion; label: string; short: string; color: string }[] = [
  { value: 'oral',             label: 'Oral',            short: 'Oral', color: 'bg-blue-50 text-blue-700 border-blue-200'     },
  { value: 'escrito',          label: 'Escrito',         short: 'Esc',  color: 'bg-slate-50 text-slate-600 border-slate-200'  },
  { value: 'trabajo_practico', label: 'Trabajo Práctico',short: 'T.P.', color: 'bg-purple-50 text-purple-700 border-purple-200'},
  { value: 'otro',             label: 'Otro',            short: 'Otro', color: 'bg-amber-50 text-amber-700 border-amber-200'  },
]

interface FilaAlumno {
  alumno: Alumno
  calificaciones: Calificacion[]
  promedio: PromedioTrimestre | null
  promedioEditado: string
}

type SeccionMateria = { materia: Materia; filas: FilaAlumno[] }

const selectClass = 'border border-slate-300 rounded-[10px] px-3 h-[42px] text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition-colors'

function colorNota(nota: number) {
  return nota >= 7 ? 'text-emerald-600' : nota >= 4 ? 'text-amber-600' : 'text-red-500'
}

function colorPromedio(p: number): string {
  return p >= 7
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : p >= 4
    ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-red-50 text-red-700 border-red-200'
}

function tipoInfo(tipo: TipoEvaluacion) {
  return TIPOS.find(t => t.value === tipo) ?? TIPOS[1]
}

function generarHTMLPlanilla(
  secciones: SeccionMateria[],
  trimestre: Trimestre,
  anio: number,
  filtroAlumnoId: string,
): string {
  const trimestreLabel = TRIMESTRES.find(t => t.value === trimestre)?.label ?? trimestre
  const esUnaMateria = secciones.length === 1
  const materiaTitulo = esUnaMateria ? secciones[0].materia : 'Todas las materias'
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })

  const seccionesHTML = secciones.map(({ materia, filas }) => {
    const filasTarget = filtroAlumnoId === 'todos'
      ? filas
      : filas.filter(f => f.alumno.id === filtroAlumnoId)

    const rows = filasTarget.map(fila => {
      const califs = fila.calificaciones
      const promCalc = califs.length > 0
        ? (califs.reduce((acc, c) => acc + c.nota, 0) / califs.length).toFixed(2)
        : null

      const evalRows = califs.map(c => `
        <tr>
          <td>${c.nombre_examen}</td>
          <td>${tipoInfo(c.tipo).label}</td>
          <td class="nota">${c.nota}</td>
        </tr>`).join('')

      return `
        <div class="alumno-block">
          <div class="alumno-header">
            <span class="alumno-nombre">${fila.alumno.apellido}, ${fila.alumno.nombre}</span>
            ${fila.promedio ? `<span class="promedio-guardado">Promedio guardado: <strong>${fila.promedio.promedio}</strong></span>` : ''}
          </div>
          ${califs.length > 0 ? `
            <table>
              <thead>
                <tr><th>Evaluación</th><th>Tipo</th><th>Nota</th></tr>
              </thead>
              <tbody>${evalRows}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2">Promedio calculado</td>
                  <td class="nota"><strong>${promCalc ?? '—'}</strong></td>
                </tr>
              </tfoot>
            </table>
          ` : '<p class="sin-datos">Sin evaluaciones cargadas</p>'}
        </div>`
    }).join('')

    return `
      ${!esUnaMateria ? `<div class="materia-titulo">${materia}</div>` : ''}
      ${rows || '<p style="color:#9ca3af;font-size:12px;font-style:italic">Sin datos para mostrar</p>'}
    `
  }).join('')

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Calificaciones · ${materiaTitulo}</title>
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
    .materia-titulo { font-size: 15px; font-weight: 700; color: #1b2b44; padding: 10px 0 8px; border-bottom: 2px solid #e2e8f0; margin-bottom: 16px; margin-top: 28px; }
    .alumno-block { margin-bottom: 28px; break-inside: avoid; }
    .alumno-header { display: flex; align-items: baseline; justify-content: space-between; margin-bottom: 8px; }
    .alumno-nombre { font-size: 14px; font-weight: 700; color: #1b2b44; }
    .promedio-guardado { font-size: 12px; color: #059669; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #f1f5f9; text-align: left; padding: 6px 10px; font-weight: 600; color: #475569; font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; border: 1px solid #e2e8f0; }
    td { padding: 6px 10px; border: 1px solid #e2e8f0; color: #374151; }
    tfoot td { background: #f8fafc; font-size: 12px; color: #475569; }
    .nota { text-align: center; font-variant-numeric: tabular-nums; }
    .sin-datos { font-size: 12px; color: #9ca3af; font-style: italic; padding: 6px 0; }
    @media print {
      body { padding: 20px; }
      .alumno-block { page-break-inside: avoid; }
      .materia-titulo { page-break-before: auto; }
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <h1>EPEP N° 120 · Mayor Villafañe</h1>
    <h2>Planilla de Calificaciones</h2>
    <div class="doc-meta">
      <span><strong>Materia:</strong> ${materiaTitulo}</span>
      <span><strong>Trimestre:</strong> ${trimestreLabel}</span>
      <span><strong>Año:</strong> ${anio}</span>
    </div>
    <p class="fecha-impresion">Impreso el ${fecha}</p>
  </div>
  ${seccionesHTML}
  <script>window.onload = () => window.print()</script>
</body>
</html>`
}

function generarPDF(
  secciones: SeccionMateria[],
  trimestre: Trimestre,
  anio: number,
  filtroAlumnoId: string,
): { blob: Blob; filename: string } {
  const trimestreLabel = TRIMESTRES.find(t => t.value === trimestre)?.label ?? trimestre
  const fecha = new Date().toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })
  const esUnaMateria = secciones.length === 1
  const materiaTitulo = esUnaMateria ? secciones[0].materia : 'Todas las materias'

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const azul = [27, 43, 68] as [number, number, number]
  const gris = [100, 116, 139] as [number, number, number]

  doc.setFillColor(...azul)
  doc.rect(0, 0, 210, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('EPEP N° 120 · Mayor Villafañe', 14, 11.5)

  doc.setTextColor(...azul)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Planilla de Calificaciones', 14, 28)

  doc.setDrawColor(...azul)
  doc.setLineWidth(0.5)
  doc.line(14, 30, 196, 30)

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...gris)
  doc.text(`Materia: ${materiaTitulo}`, 14, 36)
  doc.text(`Trimestre: ${trimestreLabel}   ·   Año: ${anio}`, 14, 41)
  doc.text(`Impreso: ${fecha}`, 14, 46)

  let y = 54

  secciones.forEach(({ materia, filas }, secIdx) => {
    const filasTarget = filtroAlumnoId === 'todos'
      ? filas
      : filas.filter(f => f.alumno.id === filtroAlumnoId)

    if (!esUnaMateria) {
      if (secIdx > 0) {
        doc.addPage()
        y = 20
      }
      if (y > 250) { doc.addPage(); y = 20 }
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...azul)
      doc.text(materia, 14, y)
      doc.setDrawColor(203, 213, 225)
      doc.setLineWidth(0.4)
      doc.line(14, y + 2, 196, y + 2)
      y += 9
    }

    filasTarget.forEach((fila, idx) => {
      const califs = fila.calificaciones
      const promCalc = califs.length > 0
        ? parseFloat((califs.reduce((acc, c) => acc + c.nota, 0) / califs.length).toFixed(2))
        : null

      if (y > 250) { doc.addPage(); y = 20 }

      doc.setFontSize(10)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...azul)
      doc.text(`${fila.alumno.apellido}, ${fila.alumno.nombre}`, 14, y)

      if (fila.promedio) {
        doc.setFontSize(9)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(5, 150, 105)
        doc.text(`Promedio guardado: ${fila.promedio.promedio}`, 130, y)
      }

      y += 2

      if (califs.length === 0) {
        doc.setFontSize(8)
        doc.setFont('helvetica', 'italic')
        doc.setTextColor(...gris)
        doc.text('Sin evaluaciones cargadas', 14, y + 5)
        y += 12
      } else {
        autoTable(doc, {
          startY: y,
          head: [[
            { content: 'Evaluación', styles: { halign: 'left' as const } },
            { content: 'Tipo', styles: { halign: 'center' as const } },
            { content: 'Nota', styles: { halign: 'center' as const } },
          ]],
          body: califs.map(c => [c.nombre_examen, tipoInfo(c.tipo).label, String(c.nota)]),
          foot: promCalc !== null
            ? [[
                { content: 'Promedio calculado', colSpan: 2, styles: { halign: 'right' as const, fontStyle: 'bold' as const, fontSize: 9 } },
                { content: String(promCalc), styles: { halign: 'center' as const, fontStyle: 'bold' as const, fontSize: 9 } },
              ]]
            : [],
          margin: { left: 14, right: 14 },
          tableWidth: 182,
          columnStyles: {
            0: { cellWidth: 110 },
            1: { cellWidth: 42, halign: 'center' },
            2: { cellWidth: 30, halign: 'center', fontStyle: 'bold' },
          },
          headStyles: {
            fillColor: [241, 245, 249],
            textColor: [71, 85, 105],
            fontStyle: 'bold',
            fontSize: 8,
          },
          bodyStyles: { fontSize: 9, textColor: [55, 65, 81] },
          footStyles: {
            fillColor: [248, 250, 252],
            textColor: [71, 85, 105],
            fontStyle: 'bold',
            fontSize: 9,
          },
          alternateRowStyles: { fillColor: [250, 252, 255] },
        })
        y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + (idx < filasTarget.length - 1 ? 8 : 4)
      }
    })
  })

  const slug = esUnaMateria
    ? secciones[0].materia.replace(/\s+/g, '_').toLowerCase()
    : 'todas_las_materias'
  const filename = `calificaciones_${slug}_${trimestre}_${anio}.pdf`
  return { blob: doc.output('blob') as Blob, filename }
}

async function fetchUnaMateria(m: Materia, trimestre: Trimestre, anio: number): Promise<SeccionMateria> {
  const [alumnosRes, califRes, promRes] = await Promise.all([
    supabase.from('alumnos').select('*').order('apellido'),
    supabase.from('calificaciones').select('*').eq('materia', m).eq('trimestre', trimestre).eq('anio', anio),
    supabase.from('promedios_trimestre').select('*').eq('materia', m).eq('trimestre', trimestre).eq('anio', anio),
  ])
  if (alumnosRes.error) return { materia: m, filas: [] }
  const alumnos = alumnosRes.data as Alumno[]
  const califPorAlumno: Record<string, Calificacion[]> = {}
  ;(califRes.data ?? []).forEach(c => {
    if (!califPorAlumno[c.alumno_id]) califPorAlumno[c.alumno_id] = []
    califPorAlumno[c.alumno_id].push(c as Calificacion)
  })
  const promPorAlumno: Record<string, PromedioTrimestre> = {}
  ;(promRes.data ?? []).forEach(p => { promPorAlumno[p.alumno_id] = p as PromedioTrimestre })
  const filas: FilaAlumno[] = alumnos.map(a => {
    const prom = promPorAlumno[a.id] ?? null
    const califs = califPorAlumno[a.id] ?? []
    const calcPromedio = califs.length > 0
      ? parseFloat((califs.reduce((acc, c) => acc + c.nota, 0) / califs.length).toFixed(2))
      : null
    return {
      alumno: a,
      calificaciones: califs,
      promedio: prom,
      promedioEditado: prom ? String(prom.promedio) : (calcPromedio !== null ? String(calcPromedio) : ''),
    }
  })
  return { materia: m, filas }
}

async function fetchTodasMaterias(trimestre: Trimestre, anio: number): Promise<SeccionMateria[]> {
  const [alumnosRes, califRes, promRes] = await Promise.all([
    supabase.from('alumnos').select('*').order('apellido'),
    supabase.from('calificaciones').select('*').eq('trimestre', trimestre).eq('anio', anio),
    supabase.from('promedios_trimestre').select('*').eq('trimestre', trimestre).eq('anio', anio),
  ])

  if (alumnosRes.error) return []

  const alumnos = alumnosRes.data as Alumno[]

  return MATERIAS.map(mat => {
    const califPorAlumno: Record<string, Calificacion[]> = {}
    ;(califRes.data ?? [])
      .filter(c => c.materia === mat)
      .forEach(c => {
        if (!califPorAlumno[c.alumno_id]) califPorAlumno[c.alumno_id] = []
        califPorAlumno[c.alumno_id].push(c as Calificacion)
      })

    const promPorAlumno: Record<string, PromedioTrimestre> = {}
    ;(promRes.data ?? [])
      .filter(p => p.materia === mat)
      .forEach(p => { promPorAlumno[p.alumno_id] = p as PromedioTrimestre })

    const filas: FilaAlumno[] = alumnos.map(a => {
      const prom = promPorAlumno[a.id] ?? null
      const califs = califPorAlumno[a.id] ?? []
      const calcPromedio = califs.length > 0
        ? parseFloat((califs.reduce((acc, c) => acc + c.nota, 0) / califs.length).toFixed(2))
        : null
      return {
        alumno: a,
        calificaciones: califs,
        promedio: prom,
        promedioEditado: prom ? String(prom.promedio) : (calcPromedio !== null ? String(calcPromedio) : ''),
      }
    })

    return { materia: mat, filas }
  })
}

export default function Calificaciones() {
  const anioActual = new Date().getFullYear()
  const [anio, setAnio] = useState(anioActual)
  const [trimestre, setTrimestre] = useState<Trimestre>('T1')
  const [materia, setMateria] = useState<Materia>(MATERIAS[0])
  const [filas, setFilas] = useState<FilaAlumno[]>([])
  const [loading, setLoading] = useState(false)
  const [calculando, setCalculando] = useState(false)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [nuevosExamenes, setNuevosExamenes] = useState<
    Record<string, { nombre: string; nota: string; tipo: TipoEvaluacion }>
  >({})

  const [showPrint, setShowPrint] = useState(false)
  const [printAlumno, setPrintAlumno] = useState<string>('todos')
  const [printMateria, setPrintMateria] = useState<Materia | 'todas'>(MATERIAS[0])
  const [loadingPrint, setLoadingPrint] = useState(false)

  useEffect(() => { fetchData() }, [anio, trimestre, materia])

  async function fetchData() {
    setLoading(true)
    const [alumnosRes, califRes, promRes] = await Promise.all([
      supabase.from('alumnos').select('*').order('apellido'),
      supabase.from('calificaciones').select('*')
        .eq('materia', materia).eq('trimestre', trimestre).eq('anio', anio),
      supabase.from('promedios_trimestre').select('*')
        .eq('materia', materia).eq('trimestre', trimestre).eq('anio', anio),
    ])

    if (alumnosRes.error) { toast.error('Error al cargar'); setLoading(false); return }

    const califPorAlumno: Record<string, Calificacion[]> = {}
    ;(califRes.data ?? []).forEach(c => {
      if (!califPorAlumno[c.alumno_id]) califPorAlumno[c.alumno_id] = []
      califPorAlumno[c.alumno_id].push(c as Calificacion)
    })

    const promPorAlumno: Record<string, PromedioTrimestre> = {}
    ;(promRes.data ?? []).forEach(p => { promPorAlumno[p.alumno_id] = p as PromedioTrimestre })

    setFilas((alumnosRes.data ?? []).map(a => {
      const prom = promPorAlumno[a.id] ?? null
      const califs = califPorAlumno[a.id] ?? []
      const calcPromedio = califs.length > 0
        ? parseFloat((califs.reduce((acc, c) => acc + c.nota, 0) / califs.length).toFixed(2))
        : null
      return {
        alumno: a as Alumno,
        calificaciones: califs,
        promedio: prom,
        promedioEditado: prom ? String(prom.promedio) : (calcPromedio !== null ? String(calcPromedio) : ''),
      }
    }))
    setNuevosExamenes({})
    setLoading(false)
  }

  function toggleExpandido(id: string) {
    setExpandidos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function expandirTodos() {
    setExpandidos(new Set(filas.map(f => f.alumno.id)))
  }

  function contraerTodos() {
    setExpandidos(new Set())
  }

  function setNuevoExamen(alumnoId: string, field: 'nombre' | 'nota' | 'tipo', value: string) {
    setNuevosExamenes(prev => ({
      ...prev,
      [alumnoId]: { ...(prev[alumnoId] ?? { nombre: '', nota: '', tipo: 'escrito' as TipoEvaluacion }), [field]: value },
    }))
  }

  async function agregarExamen(alumnoId: string) {
    const nuevo = nuevosExamenes[alumnoId]
    if (!nuevo?.nombre.trim()) { toast.error('Ingresá el nombre de la evaluación'); return }
    const nota = parseFloat(nuevo.nota)
    if (isNaN(nota) || nota < 1 || nota > 10) { toast.error('La nota debe ser entre 1 y 10'); return }
    const tipo: TipoEvaluacion = nuevo.tipo ?? 'escrito'

    const { data, error } = await supabase.from('calificaciones').insert({
      alumno_id: alumnoId, materia, trimestre, anio,
      nombre_examen: nuevo.nombre.trim(), nota, tipo,
    }).select().single()

    if (error) { toast.error('Error al guardar'); return }

    setFilas(prev => prev.map(f => {
      if (f.alumno.id !== alumnoId) return f
      const newCalifs = [...f.calificaciones, data as Calificacion]
      const newCalc = parseFloat((newCalifs.reduce((acc, c) => acc + c.nota, 0) / newCalifs.length).toFixed(2))
      return {
        ...f,
        calificaciones: newCalifs,
        promedioEditado: f.promedio ? f.promedioEditado : String(newCalc),
      }
    }))
    setNuevosExamenes(prev => ({ ...prev, [alumnoId]: { nombre: '', nota: '', tipo: 'escrito' } }))
  }

  async function eliminarExamen(alumnoId: string, califId: string) {
    const { error } = await supabase.from('calificaciones').delete().eq('id', califId)
    if (error) { toast.error('Error al eliminar'); return }
    setFilas(prev => prev.map(f => {
      if (f.alumno.id !== alumnoId) return f
      const newCalifs = f.calificaciones.filter(c => c.id !== califId)
      const newCalc = newCalifs.length > 0
        ? parseFloat((newCalifs.reduce((acc, c) => acc + c.nota, 0) / newCalifs.length).toFixed(2))
        : null
      return {
        ...f,
        calificaciones: newCalifs,
        promedioEditado: f.promedio ? f.promedioEditado : (newCalc !== null ? String(newCalc) : ''),
      }
    }))
  }

  function setPromedioEditado(alumnoId: string, valor: string) {
    setFilas(prev => prev.map(f =>
      f.alumno.id === alumnoId ? { ...f, promedioEditado: valor } : f
    ))
  }

  async function calcularYGuardar() {
    setCalculando(true)
    try {
      const registros = filas
        .filter(f => f.calificaciones.length > 0)
        .map(f => {
          const promCalc = f.calificaciones.reduce((acc, c) => acc + c.nota, 0) / f.calificaciones.length
          return { alumno_id: f.alumno.id, materia, trimestre, anio, promedio: parseFloat(promCalc.toFixed(2)) }
        })

      if (registros.length === 0) { toast.error('No hay calificaciones cargadas'); return }

      const { error } = await supabase
        .from('promedios_trimestre')
        .upsert(registros, { onConflict: 'alumno_id,materia,trimestre,anio' })

      if (error) throw error
      toast.success('Promedios calculados y guardados')
      fetchData()
    } catch {
      toast.error('Error al calcular promedios')
    } finally {
      setCalculando(false)
    }
  }

  async function guardarPromedioManual(fila: FilaAlumno) {
    const valor = parseFloat(fila.promedioEditado.replace(',', '.'))
    if (isNaN(valor) || valor < 1 || valor > 10) { toast.error('El promedio debe ser entre 1 y 10'); return }

    const { error } = await supabase.from('promedios_trimestre').upsert({
      alumno_id: fila.alumno.id, materia, trimestre, anio, promedio: valor,
    }, { onConflict: 'alumno_id,materia,trimestre,anio' })

    if (error) { toast.error('Error al guardar'); return }
    toast.success(`Promedio de ${fila.alumno.nombre} guardado`)
    fetchData()
  }

  async function getSecciones(): Promise<SeccionMateria[]> {
    if (printMateria === 'todas') return fetchTodasMaterias(trimestre, anio)
    if (printMateria === materia) return [{ materia, filas }]
    return [await fetchUnaMateria(printMateria, trimestre, anio)]
  }

  async function handleImprimir() {
    setLoadingPrint(true)
    const secciones = await getSecciones()
    setLoadingPrint(false)
    const html = generarHTMLPlanilla(secciones, trimestre, anio, printAlumno)
    const win = window.open('', '_blank', 'width=900,height=700')
    win?.document.write(html)
    win?.document.close()
    setShowPrint(false)
  }

  async function handleDescargarPDF() {
    setLoadingPrint(true)
    const secciones = await getSecciones()
    setLoadingPrint(false)
    const { blob, filename } = generarPDF(secciones, trimestre, anio, printAlumno)
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    setShowPrint(false)
  }

  async function handleCompartirWhatsApp() {
    setLoadingPrint(true)
    const secciones = await getSecciones()
    setLoadingPrint(false)

    // Intentar compartir PDF como archivo (Android/iOS Safari 15+)
    if (typeof navigator.canShare === 'function') {
      const { blob, filename } = generarPDF(secciones, trimestre, anio, printAlumno)
      const file = new File([blob], filename, { type: 'application/pdf' })
      if (navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Calificaciones' })
          setShowPrint(false)
          return
        } catch (e) {
          if ((e as Error).name === 'AbortError') { setShowPrint(false); return }
          // Otro error: cae al texto
        }
      }
    }

    // Fallback: texto por wa.me
    const trimestreLabel = TRIMESTRES.find(t => t.value === trimestre)?.label ?? trimestre
    const esUnaMateria = secciones.length === 1
    const titulo = esUnaMateria ? `Calificaciones · ${secciones[0].materia}` : 'Calificaciones'
    let texto = `*${titulo}*\n*${trimestreLabel} ${anio}*\n\n`
    secciones.forEach(({ materia: mat, filas: filasSeccion }, i) => {
      if (!esUnaMateria) texto += `📚 *${mat}*\n`
      const target = printAlumno === 'todos' ? filasSeccion : filasSeccion.filter(f => f.alumno.id === printAlumno)
      target.forEach(fila => {
        const califs = fila.calificaciones
        const prom = fila.promedio?.promedio
          ?? (califs.length > 0 ? (califs.reduce((a, c) => a + c.nota, 0) / califs.length).toFixed(2) : null)
        texto += `• ${fila.alumno.apellido}, ${fila.alumno.nombre}: ${prom ?? '—'}\n`
      })
      if (!esUnaMateria && i < secciones.length - 1) texto += '\n'
    })
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank')
    setShowPrint(false)
  }

  const hayCalificaciones = filas.some(f => f.calificaciones.length > 0)
  const todosExpandidos = filas.length > 0 && filas.every(f => expandidos.has(f.alumno.id))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Calificaciones</h1>
          <p className="text-sm text-slate-500 mt-1">Notas por materia y trimestre</p>
        </div>
        <Button variant="secondary" onClick={() => { setPrintMateria(materia); setPrintAlumno('todos'); setShowPrint(true) }}>
          <Printer size={15} strokeWidth={1.75} />
          Imprimir
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 items-end flex-wrap">
        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Año</label>
          <select
            value={anio}
            onChange={e => setAnio(Number(e.target.value))}
            className={selectClass}
          >
            {[anioActual - 2, anioActual - 1, anioActual, anioActual + 1].map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Trimestre</label>
          <select
            value={trimestre}
            onChange={e => setTrimestre(e.target.value as Trimestre)}
            className={selectClass}
          >
            {TRIMESTRES.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Materia</label>
          <select value={materia} onChange={e => setMateria(e.target.value as Materia)} className={selectClass}>
            {MATERIAS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Cargando...</div>
      ) : filas.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">No hay alumnos registrados</div>
      ) : (
        <>
          {/* Controles expand/collapse */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {expandidos.size} de {filas.length} alumnos expandidos
            </p>
            <button
              onClick={todosExpandidos ? contraerTodos : expandirTodos}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
            >
              <ChevronsUpDown size={13} strokeWidth={2} />
              {todosExpandidos ? 'Contraer todos' : 'Expandir todos'}
            </button>
          </div>

          {/* Lista de alumnos */}
          <div className="space-y-2">
            {filas.map(fila => {
              const expandido = expandidos.has(fila.alumno.id)
              const nuevo = nuevosExamenes[fila.alumno.id] ?? { nombre: '', nota: '', tipo: 'escrito' as TipoEvaluacion }
              const promCalc = fila.calificaciones.length > 0
                ? parseFloat((fila.calificaciones.reduce((acc, c) => acc + c.nota, 0) / fila.calificaciones.length).toFixed(2))
                : null

              return (
                <div
                  key={fila.alumno.id}
                  className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden"
                  style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
                >
                  {/* Header clickeable */}
                  <button
                    onClick={() => toggleExpandido(fila.alumno.id)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50/70 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {expandido
                        ? <ChevronUp size={15} strokeWidth={2} className="text-slate-400 shrink-0" />
                        : <ChevronDown size={15} strokeWidth={2} className="text-slate-400 shrink-0" />
                      }
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {fila.alumno.apellido}, {fila.alumno.nombre}
                        </p>
                        {!expandido && fila.calificaciones.length > 0 && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {fila.calificaciones.length} evaluación{fila.calificaciones.length !== 1 ? 'es' : ''}
                            {fila.calificaciones.length > 0 && (
                              <span className="ml-2">
                                {fila.calificaciones.map(c => tipoInfo(c.tipo).short).join(', ')}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {fila.promedio ? (
                        <div className={`text-sm font-bold px-3 py-1 rounded-lg border ${colorPromedio(fila.promedio.promedio)}`}>
                          {fila.promedio.promedio}
                        </div>
                      ) : promCalc !== null ? (
                        <div className={`text-sm font-semibold px-3 py-1 rounded-lg border border-dashed ${colorPromedio(promCalc)} opacity-60`}>
                          ~{promCalc}
                        </div>
                      ) : (
                        <div className="text-sm text-slate-300 px-3 py-1 rounded-lg border border-slate-100 bg-slate-50">
                          —
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Contenido expandible */}
                  {expandido && (
                    <div className="px-5 pb-5 pt-1 space-y-4 border-t border-slate-100">

                      {/* Lista de evaluaciones */}
                      {fila.calificaciones.length === 0 ? (
                        <p className="text-xs text-slate-400 italic py-2">Sin evaluaciones cargadas aún</p>
                      ) : (
                        <div className="space-y-0.5">
                          {fila.calificaciones.map(c => {
                            const ti = tipoInfo(c.tipo)
                            return (
                              <div key={c.id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-50 group transition-colors">
                                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border shrink-0 ${ti.color}`}>
                                  {ti.short}
                                </span>
                                <span className="text-sm text-slate-700 flex-1">{c.nombre_examen}</span>
                                <span className={`text-sm font-bold w-7 text-center ${colorNota(c.nota)}`}>
                                  {c.nota}
                                </span>
                                <button
                                  onClick={() => eliminarExamen(fila.alumno.id, c.id)}
                                  className="text-slate-300 hover:text-red-500 transition-colors opacity-100 md:opacity-0 md:group-hover:opacity-100 cursor-pointer"
                                >
                                  <X size={14} strokeWidth={2} />
                                </button>
                              </div>
                            )
                          })}

                          {/* Promedio calculado */}
                          <div className="flex items-center justify-between px-3 py-2 mt-1 border-t border-slate-100">
                            <span className="text-xs text-slate-500">Promedio calculado</span>
                            <span className={`text-sm font-bold ${promCalc !== null ? colorNota(promCalc) : 'text-slate-400'}`}>
                              {promCalc ?? '—'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Formulario agregar evaluación */}
                      <div className="flex gap-2 flex-wrap">
                        <input
                          type="text"
                          placeholder="Nombre de la evaluación"
                          value={nuevo.nombre}
                          onChange={e => setNuevoExamen(fila.alumno.id, 'nombre', e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && agregarExamen(fila.alumno.id)}
                          className="flex-1 min-w-[160px] border border-slate-200 rounded-lg px-3 h-9 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors placeholder:text-slate-400"
                        />
                        <select
                          value={nuevo.tipo}
                          onChange={e => setNuevoExamen(fila.alumno.id, 'tipo', e.target.value)}
                          className="border border-slate-200 rounded-lg px-2 h-9 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 bg-white transition-colors cursor-pointer"
                        >
                          {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                        <input
                          type="number"
                          placeholder="Nota"
                          min="1" max="10" step="0.1"
                          value={nuevo.nota}
                          onChange={e => setNuevoExamen(fila.alumno.id, 'nota', e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && agregarExamen(fila.alumno.id)}
                          className="w-20 border border-slate-200 rounded-lg px-3 h-9 text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors placeholder:text-slate-400 text-center"
                        />
                        <button
                          onClick={() => agregarExamen(fila.alumno.id)}
                          className="h-9 px-3 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus size={13} strokeWidth={2.5} />
                          Agregar
                        </button>
                      </div>

                      {/* Promedio del trimestre */}
                      {fila.calificaciones.length > 0 && (
                        <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                          <span className="text-xs text-slate-500 flex-1">Promedio del trimestre</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1" max="10" step="0.01"
                              placeholder="—"
                              value={fila.promedioEditado}
                              onChange={e => setPromedioEditado(fila.alumno.id, e.target.value)}
                              className="w-16 border border-slate-300 rounded-lg px-2 h-8 text-sm font-bold text-center outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-colors"
                            />
                            <button
                              onClick={() => guardarPromedioManual(fila)}
                              className="h-8 px-3 rounded-lg text-xs font-semibold bg-white text-slate-700 hover:bg-slate-50 border border-slate-300 transition-colors cursor-pointer"
                            >
                              Guardar
                            </button>
                          </div>
                          {fila.promedio && (
                            <span className="text-xs font-semibold text-emerald-600">
                              ✓ {fila.promedio.promedio}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {hayCalificaciones && (
            <Button onClick={calcularYGuardar} loading={calculando}>
              Calcular y guardar todos los promedios
            </Button>
          )}
        </>
      )}

      {/* Modal de impresión */}
      {showPrint && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
          onClick={e => { if (e.target === e.currentTarget) setShowPrint(false) }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Imprimir planilla</h2>
                <p className="text-xs text-slate-500 mt-0.5">{TRIMESTRES.find(t => t.value === trimestre)?.label} · {anio}</p>
              </div>
              <button
                onClick={() => setShowPrint(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X size={18} strokeWidth={1.75} />
              </button>
            </div>

            {/* Modal body */}
            <div className="px-6 py-5 space-y-4">
              {/* Filtro alumno */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Alumno</label>
                <select
                  value={printAlumno}
                  onChange={e => setPrintAlumno(e.target.value)}
                  className={`${selectClass} cursor-pointer`}
                >
                  <option value="todos">Todos los alumnos</option>
                  {filas.map(f => (
                    <option key={f.alumno.id} value={f.alumno.id}>
                      {f.alumno.apellido}, {f.alumno.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro materia */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Materia</label>
                <select
                  value={printMateria}
                  onChange={e => setPrintMateria(e.target.value as Materia | 'todas')}
                  className={`${selectClass} cursor-pointer`}
                >
                  <option value="todas">Todas las materias</option>
                  {MATERIAS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div
                className="rounded-xl px-4 py-3 text-xs text-slate-600"
                style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}
              >
                {printMateria === 'todas'
                  ? 'Se cargarán todas las materias del trimestre seleccionado. Puede demorar unos segundos.'
                  : 'Se abrirá una ventana con el formato de impresión listo para imprimir o guardar como PDF.'
                }
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 flex-wrap">
              <Button variant="secondary" onClick={() => setShowPrint(false)}>Cancelar</Button>
              <Button variant="secondary" loading={loadingPrint} onClick={handleDescargarPDF}>
                <Download size={14} strokeWidth={1.75} />
                Descargar PDF
              </Button>
              <Button variant="secondary" loading={loadingPrint} onClick={handleImprimir}>
                <Printer size={14} strokeWidth={1.75} />
                Imprimir
              </Button>
              <button
                disabled={loadingPrint}
                onClick={handleCompartirWhatsApp}
                className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-xs font-semibold border transition-colors cursor-pointer bg-[#25D366] text-white border-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-50 disabled:cursor-not-allowed"
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
