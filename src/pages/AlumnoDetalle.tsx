import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Alumno, Tutor, Sexo } from '../types'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Select from '../components/ui/Select'
import Card from '../components/ui/Card'

const sexoOpts = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
  { value: 'Otro', label: 'Otro' },
]

const relacionOpts = [
  { value: 'Madre', label: 'Madre' },
  { value: 'Padre', label: 'Padre' },
  { value: 'Tutor/a', label: 'Tutor/a' },
  { value: 'Abuelo/a', label: 'Abuelo/a' },
  { value: 'Otro', label: 'Otro' },
]

const emptyAlumno: Omit<Alumno, 'id' | 'created_at'> = {
  nombre: '', apellido: '', dni: '', fecha_nacimiento: '', sexo: 'M',
  nacionalidad: 'Argentina', fecha_ingreso: '', domicilio: '',
}

const emptyTutor: Omit<Tutor, 'id' | 'alumno_id' | 'created_at'> = {
  nombre: '', apellido: '', relacion: '', telefono: '',
  fecha_nacimiento: '', sexo: 'M', nacionalidad: 'Argentina', domicilio: '',
}

export default function AlumnoDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = !id

  const [alumno, setAlumno] = useState(emptyAlumno)
  const [tutor, setTutor] = useState(emptyTutor)
  const [tutorId, setTutorId] = useState<string | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isNew) fetchData()
  }, [id])

  async function fetchData() {
    setLoading(true)
    const [alumnoRes, tutorRes] = await Promise.all([
      supabase.from('alumnos').select('*').eq('id', id!).single(),
      supabase.from('tutores').select('*').eq('alumno_id', id!).maybeSingle(),
    ])

    if (alumnoRes.error) { toast.error('Alumno no encontrado'); navigate('/alumnos'); return }

    const { id: _id, created_at: _ca, ...alumnoData } = alumnoRes.data
    setAlumno(alumnoData)

    if (tutorRes.data) {
      const { id: tid, alumno_id: _aid, created_at: _tca, ...tutorData } = tutorRes.data
      setTutor(tutorData)
      setTutorId(tid)
    }
    setLoading(false)
  }

  async function handleSave() {
    if (!alumno.nombre || !alumno.apellido || !alumno.dni || !alumno.fecha_nacimiento || !alumno.fecha_ingreso || !alumno.domicilio) {
      toast.error('Completá todos los campos del alumno')
      return
    }

    setSaving(true)
    try {
      let alumnoId = id

      if (isNew) {
        const { data, error } = await supabase.from('alumnos').insert(alumno).select().single()
        if (error) throw error
        alumnoId = data.id
      } else {
        const { error } = await supabase.from('alumnos').update(alumno).eq('id', id!)
        if (error) throw error
      }

      if (tutor.nombre && tutor.apellido) {
        if (tutorId) {
          const { error } = await supabase.from('tutores').update(tutor).eq('id', tutorId)
          if (error) throw error
        } else {
          const { error } = await supabase.from('tutores').insert({ ...tutor, alumno_id: alumnoId! })
          if (error) throw error
        }
      }

      toast.success(isNew ? 'Alumno creado correctamente' : 'Alumno actualizado')
      navigate('/alumnos')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-12 text-slate-400 text-sm">Cargando...</div>

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <button
          onClick={() => navigate('/alumnos')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors mb-3 cursor-pointer"
        >
          <ChevronLeft size={16} strokeWidth={1.75} />
          <span>Volver a alumnos</span>
        </button>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          {isNew ? 'Nuevo alumno' : `${alumno.apellido}, ${alumno.nombre}`}
        </h1>
      </div>

      <Card title="Datos del alumno">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre *" value={alumno.nombre} onChange={e => setAlumno(p => ({ ...p, nombre: e.target.value }))} />
          <Input label="Apellido *" value={alumno.apellido} onChange={e => setAlumno(p => ({ ...p, apellido: e.target.value }))} />
          <Input label="DNI *" value={alumno.dni} onChange={e => setAlumno(p => ({ ...p, dni: e.target.value }))} />
          <Input label="Fecha de nacimiento *" type="date" value={alumno.fecha_nacimiento} onChange={e => setAlumno(p => ({ ...p, fecha_nacimiento: e.target.value }))} />
          <Select label="Sexo *" value={alumno.sexo} options={sexoOpts} onChange={e => setAlumno(p => ({ ...p, sexo: e.target.value as Sexo }))} />
          <Input label="Nacionalidad *" value={alumno.nacionalidad} onChange={e => setAlumno(p => ({ ...p, nacionalidad: e.target.value }))} />
          <Input label="Fecha de ingreso *" type="date" value={alumno.fecha_ingreso} onChange={e => setAlumno(p => ({ ...p, fecha_ingreso: e.target.value }))} />
          <Input label="Domicilio *" value={alumno.domicilio} onChange={e => setAlumno(p => ({ ...p, domicilio: e.target.value }))} />
        </div>
      </Card>

      <Card title="Datos del tutor/a">
        <p className="text-xs text-slate-500 mb-5">Opcional. Podés completarlo ahora o más tarde.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Nombre" value={tutor.nombre} onChange={e => setTutor(p => ({ ...p, nombre: e.target.value }))} />
          <Input label="Apellido" value={tutor.apellido} onChange={e => setTutor(p => ({ ...p, apellido: e.target.value }))} />
          <Select label="Relación" value={tutor.relacion} options={relacionOpts} onChange={e => setTutor(p => ({ ...p, relacion: e.target.value }))} />
          <Input label="Teléfono" value={tutor.telefono} onChange={e => setTutor(p => ({ ...p, telefono: e.target.value }))} />
          <Input label="Fecha de nacimiento" type="date" value={tutor.fecha_nacimiento ?? ''} onChange={e => setTutor(p => ({ ...p, fecha_nacimiento: e.target.value }))} />
          <Select label="Sexo" value={tutor.sexo ?? ''} options={sexoOpts} onChange={e => setTutor(p => ({ ...p, sexo: e.target.value as Sexo }))} />
          <Input label="Nacionalidad" value={tutor.nacionalidad ?? ''} onChange={e => setTutor(p => ({ ...p, nacionalidad: e.target.value }))} />
          <Input label="Domicilio" value={tutor.domicilio ?? ''} onChange={e => setTutor(p => ({ ...p, domicilio: e.target.value }))} />
        </div>
      </Card>

      <div className="flex gap-3">
        <Button onClick={handleSave} loading={saving}>
          {isNew ? 'Crear alumno' : 'Guardar cambios'}
        </Button>
        <Button variant="secondary" onClick={() => navigate('/alumnos')}>Cancelar</Button>
      </div>
    </div>
  )
}
