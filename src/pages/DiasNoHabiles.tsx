import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { toast } from 'sonner'
import { Download, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { DiaNoHabil, MotivoNoHabil, FeriadoAPI } from '../types'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'

const motivoOpts = [
  { value: 'feriado_provincial', label: 'Feriado provincial' },
  { value: 'asueto', label: 'Asueto' },
  { value: 'paro_docente', label: 'Paro docente' },
  { value: 'otro', label: 'Otro' },
]

const motivoLabel: Record<MotivoNoHabil, string> = {
  feriado_nacional: 'Feriado nacional',
  feriado_provincial: 'Feriado provincial',
  asueto: 'Asueto',
  paro_docente: 'Paro docente',
  otro: 'Otro',
}

const motivoBadge: Record<MotivoNoHabil, string> = {
  feriado_nacional: 'bg-blue-50 text-blue-700 border border-blue-200',
  feriado_provincial: 'bg-violet-50 text-violet-700 border border-violet-200',
  asueto: 'bg-orange-50 text-orange-700 border border-orange-200',
  paro_docente: 'bg-red-50 text-red-700 border border-red-200',
  otro: 'bg-slate-100 text-slate-600 border border-slate-200',
}

export default function DiasNoHabiles() {
  const anioActual = new Date().getFullYear()
  const [dias, setDias] = useState<DiaNoHabil[]>([])
  const [loading, setLoading] = useState(true)
  const [importando, setImportando] = useState(false)
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevoMotivo, setNuevoMotivo] = useState<MotivoNoHabil>('asueto')
  const [nuevaDesc, setNuevaDesc] = useState('')
  const [guardando, setGuardando] = useState(false)

  useEffect(() => { fetchDias() }, [])

  async function fetchDias() {
    setLoading(true)
    const { data, error } = await supabase
      .from('dias_no_habiles')
      .select('*')
      .order('fecha', { ascending: true })

    if (error) { toast.error('Error al cargar'); setLoading(false); return }
    setDias(data ?? [])
    setLoading(false)
  }

  async function importarFeriados() {
    setImportando(true)
    try {
      const res = await fetch(`https://api.argentinadatos.com/v1/feriados/${anioActual}`)
      if (!res.ok) throw new Error('Error al conectar con la API')
      const feriados: FeriadoAPI[] = await res.json()

      const nuevos = feriados.map(f => ({
        fecha: f.fecha,
        motivo: 'feriado_nacional' as MotivoNoHabil,
        descripcion: f.nombre,
        es_automatico: true,
      }))

      const { error } = await supabase
        .from('dias_no_habiles')
        .upsert(nuevos, { onConflict: 'fecha', ignoreDuplicates: true })

      if (error) throw error
      toast.success(`${nuevos.length} feriados nacionales importados`)
      fetchDias()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Error al importar feriados')
    } finally {
      setImportando(false)
    }
  }

  async function handleAgregar() {
    if (!nuevaFecha) { toast.error('Seleccioná una fecha'); return }
    if (!nuevaDesc.trim()) { toast.error('Ingresá una descripción'); return }

    setGuardando(true)
    const { error } = await supabase.from('dias_no_habiles').insert({
      fecha: nuevaFecha,
      motivo: nuevoMotivo,
      descripcion: nuevaDesc.trim(),
      es_automatico: false,
    })

    if (error) {
      toast.error(error.code === '23505' ? 'Ya existe un día no hábil para esa fecha' : 'Error al guardar')
    } else {
      toast.success('Día no hábil agregado')
      setNuevaFecha('')
      setNuevoMotivo('asueto')
      setNuevaDesc('')
      fetchDias()
    }
    setGuardando(false)
  }

  async function handleEliminar(id: string) {
    const { error } = await supabase.from('dias_no_habiles').delete().eq('id', id)
    if (error) { toast.error('Error al eliminar'); return }
    toast.success('Eliminado')
    setDias(prev => prev.filter(d => d.id !== id))
  }

  const diasAnio = dias.filter(d => d.fecha.startsWith(String(anioActual)))

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Días no hábiles</h1>
          <p className="text-sm text-slate-500 mt-1">{diasAnio.length} días registrados en {anioActual}</p>
        </div>
        <Button onClick={importarFeriados} loading={importando} variant="secondary">
          <Download size={16} strokeWidth={1.75} />
          Importar feriados {anioActual}
        </Button>
      </div>

      <Card title="Agregar día no hábil">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="Fecha"
            type="date"
            value={nuevaFecha}
            onChange={e => setNuevaFecha(e.target.value)}
          />
          <Select
            label="Motivo"
            value={nuevoMotivo}
            options={motivoOpts}
            onChange={e => setNuevoMotivo(e.target.value as MotivoNoHabil)}
          />
          <Input
            label="Descripción"
            placeholder="Ej: Paro docente, Asueto municipal..."
            value={nuevaDesc}
            onChange={e => setNuevaDesc(e.target.value)}
          />
        </div>
        <div className="mt-5">
          <Button onClick={handleAgregar} loading={guardando}>Agregar</Button>
        </div>
      </Card>

      <Card title={`Días no hábiles ${anioActual}`}>
        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Cargando...</div>
        ) : diasAnio.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            No hay días registrados. Importá los feriados nacionales o agregá uno manualmente.
          </div>
        ) : (
          <div className="space-y-2">
            {diasAnio.map(dia => (
              <div key={dia.id} className="flex items-start justify-between px-4 py-3 gap-3 rounded-xl border border-slate-100 hover:bg-slate-50/60 transition-colors">
                <div className="flex items-start md:items-center gap-2 md:gap-3 flex-wrap min-w-0">
                  <span className="text-sm font-semibold text-slate-800 w-28 md:w-32 capitalize shrink-0">
                    {format(new Date(dia.fecha + 'T00:00:00'), "d 'de' MMMM", { locale: es })}
                  </span>
                  <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full ${motivoBadge[dia.motivo]}`}>
                    {motivoLabel[dia.motivo]}
                  </span>
                  <span className="text-sm text-slate-600">{dia.descripcion}</span>
                  {dia.es_automatico && (
                    <span className="text-[11px] text-slate-400 font-medium">API</span>
                  )}
                </div>
                <button
                  onClick={() => handleEliminar(dia.id)}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 cursor-pointer"
                >
                  <Trash2 size={15} strokeWidth={1.75} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
