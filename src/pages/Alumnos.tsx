import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Search, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Alumno } from '../types'
import Button from '../components/ui/Button'

const COL = 'grid-cols-[1fr_130px_110px_160px]'
const COL_MD = `hidden md:grid ${COL}`

export default function Alumnos() {
  const [alumnos, setAlumnos] = useState<Alumno[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchAlumnos()
  }, [])

  async function fetchAlumnos() {
    setLoading(true)
    const { data, error } = await supabase
      .from('alumnos')
      .select('*')
      .order('apellido', { ascending: true })

    if (error) {
      toast.error('Error al cargar los alumnos')
    } else {
      setAlumnos(data ?? [])
    }
    setLoading(false)
  }

  async function handleDelete(id: string, nombre: string) {
    if (!confirm(`¿Eliminar a ${nombre}? Esta acción no se puede deshacer.`)) return

    const { error } = await supabase.from('alumnos').delete().eq('id', id)
    if (error) {
      toast.error('Error al eliminar el alumno')
    } else {
      toast.success('Alumno eliminado')
      setAlumnos(prev => prev.filter(a => a.id !== id))
    }
  }

  const filtrados = alumnos.filter(a =>
    `${a.nombre} ${a.apellido} ${a.dni}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Alumnos</h1>
          <p className="text-sm text-slate-500 mt-1">{alumnos.length} alumnos registrados</p>
        </div>
        <Link to="/alumnos/nuevo">
          <Button>
            <UserPlus size={16} strokeWidth={1.75} />
            Nuevo alumno
          </Button>
        </Link>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
        <input
          type="text"
          placeholder="Buscar por nombre, apellido o DNI..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-slate-300 rounded-[10px] pl-9 pr-4 h-[42px] text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-white transition-colors"
        />
      </div>

      {loading ? (
        <div className="text-center py-12 text-slate-400 text-sm">Cargando...</div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-sm">
          {search ? 'Sin resultados para la búsqueda' : 'No hay alumnos registrados'}
        </div>
      ) : (
        <div
          className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}
        >
          {/* Header — solo desktop */}
          <div className={`${COL_MD} gap-4 px-5 py-3 border-b border-slate-100 bg-slate-50/60`}>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Alumno</span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">DNI</span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Ingreso</span>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Acciones</span>
          </div>

          {/* Filas */}
          <div>
            {filtrados.map((alumno, i) => (
              <div
                key={alumno.id}
                className={`hover:bg-slate-50/60 transition-colors ${i < filtrados.length - 1 ? 'border-b border-slate-100' : ''}`}
              >
                {/* Mobile: tarjeta */}
                <div className="md:hidden px-4 py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">
                      {alumno.apellido}, {alumno.nombre}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      DNI {alumno.dni} · {new Date(alumno.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-AR')}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <Link to={`/alumnos/${alumno.id}`}>
                      <Button variant="ghost" size="sm">Editar</Button>
                    </Link>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(alumno.id, `${alumno.nombre} ${alumno.apellido}`)}>
                      Eliminar
                    </Button>
                  </div>
                </div>

                {/* Desktop: grid */}
                <div className={`hidden md:grid ${COL} gap-4 px-5 py-3.5 items-center`}>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {alumno.apellido}, {alumno.nombre}
                    </p>
                    <p className="text-xs text-slate-400 truncate mt-0.5">{alumno.domicilio}</p>
                  </div>
                  <span className="text-sm text-slate-700">{alumno.dni}</span>
                  <span className="text-sm text-slate-500">
                    {new Date(alumno.fecha_ingreso + 'T00:00:00').toLocaleDateString('es-AR')}
                  </span>
                  <div className="flex gap-2">
                    <Link to={`/alumnos/${alumno.id}`}>
                      <Button variant="ghost" size="sm">Editar</Button>
                    </Link>
                    <Button variant="danger" size="sm" onClick={() => handleDelete(alumno.id, `${alumno.nombre} ${alumno.apellido}`)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
