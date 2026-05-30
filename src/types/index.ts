export type Sexo = 'M' | 'F' | 'Otro'
export type EstadoAsistencia = 'presente' | 'ausente' | 'ausente_justificado'
export type MotivoNoHabil = 'feriado_nacional' | 'feriado_provincial' | 'asueto' | 'paro_docente' | 'otro'
export type ValorCompetencia = 'regular' | 'buena' | 'muy_buena'
export type Trimestre = 'T1' | 'T2' | 'T3'
export type TipoEvaluacion = 'oral' | 'escrito' | 'trabajo_practico' | 'otro'

export interface Alumno {
  id: string
  nombre: string
  apellido: string
  dni: string
  fecha_nacimiento: string
  sexo: Sexo
  nacionalidad: string
  fecha_ingreso: string
  domicilio: string
  created_at?: string
}

export interface Tutor {
  id: string
  alumno_id: string
  nombre: string
  apellido: string
  relacion: string
  telefono: string
  fecha_nacimiento: string
  sexo: Sexo
  nacionalidad: string
  domicilio: string
  created_at?: string
}

export interface Asistencia {
  id: string
  alumno_id: string
  fecha: string
  estado: EstadoAsistencia
  created_at?: string
}

export interface DiaNoHabil {
  id: string
  fecha: string
  motivo: MotivoNoHabil
  descripcion: string
  es_automatico: boolean
  created_at?: string
}

export interface CompetenciaSocioafectiva {
  id: string
  alumno_id: string
  periodo: string
  valor: ValorCompetencia
  created_at?: string
}

export interface AlumnoConTutor extends Alumno {
  tutores?: Tutor[]
}

export const MATERIAS = [
  'Lengua y Literatura',
  'Matemáticas',
  'Cs. Naturales',
  'Cs. Sociales',
  'Ed. Artística (Plástica)',
  'Ed. Artística (Folklore)',
  'Educación Física',
  'Tecnología',
  'Formación Ética y Ciudadana',
] as const

export type Materia = typeof MATERIAS[number]

export interface Calificacion {
  id: string
  alumno_id: string
  materia: Materia
  trimestre: Trimestre
  anio: number
  nombre_examen: string
  nota: number
  tipo: TipoEvaluacion
  created_at?: string
}

export interface PromedioTrimestre {
  id: string
  alumno_id: string
  materia: Materia
  trimestre: Trimestre
  anio: number
  promedio: number
  created_at?: string
}

export interface FeriadoAPI {
  fecha: string
  nombre: string
  tipo: string
  info?: string
}
