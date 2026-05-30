-- =============================================
-- GESTIÓN AULA - Esquema Supabase
-- =============================================

-- Tabla de alumnos
CREATE TABLE IF NOT EXISTS alumnos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  dni TEXT UNIQUE NOT NULL,
  fecha_nacimiento DATE NOT NULL,
  sexo TEXT NOT NULL CHECK (sexo IN ('M', 'F', 'Otro')),
  nacionalidad TEXT NOT NULL DEFAULT 'Argentina',
  fecha_ingreso DATE NOT NULL,
  domicilio TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de tutores (padres/madres/encargados)
CREATE TABLE IF NOT EXISTS tutores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  apellido TEXT NOT NULL,
  relacion TEXT NOT NULL,
  telefono TEXT NOT NULL,
  fecha_nacimiento DATE,
  sexo TEXT CHECK (sexo IN ('M', 'F', 'Otro')),
  nacionalidad TEXT DEFAULT 'Argentina',
  domicilio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de días no hábiles (feriados, asuetos, paros, etc.)
CREATE TABLE IF NOT EXISTS dias_no_habiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha DATE NOT NULL UNIQUE,
  motivo TEXT NOT NULL CHECK (motivo IN ('feriado_nacional', 'feriado_provincial', 'asueto', 'paro_docente', 'otro')),
  descripcion TEXT NOT NULL DEFAULT '',
  es_automatico BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de asistencias (diarias, no por materia)
CREATE TABLE IF NOT EXISTS asistencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  fecha DATE NOT NULL,
  estado TEXT NOT NULL CHECK (estado IN ('presente', 'ausente', 'ausente_justificado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, fecha)
);

-- Tabla de competencias socioafectivas (por trimestre)
CREATE TABLE IF NOT EXISTS competencias_socioafectivas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  periodo TEXT NOT NULL,
  valor TEXT NOT NULL CHECK (valor IN ('regular', 'buena', 'muy_buena')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, periodo)
);

-- =============================================
-- ÍNDICES para mejorar performance
-- =============================================
CREATE INDEX IF NOT EXISTS idx_asistencias_alumno_id ON asistencias(alumno_id);
CREATE INDEX IF NOT EXISTS idx_asistencias_fecha ON asistencias(fecha);
CREATE INDEX IF NOT EXISTS idx_asistencias_alumno_fecha ON asistencias(alumno_id, fecha);
CREATE INDEX IF NOT EXISTS idx_tutores_alumno_id ON tutores(alumno_id);
CREATE INDEX IF NOT EXISTS idx_competencias_alumno_id ON competencias_socioafectivas(alumno_id);
CREATE INDEX IF NOT EXISTS idx_dias_no_habiles_fecha ON dias_no_habiles(fecha);

-- =============================================
-- VISTAS útiles
-- =============================================

-- Vista: resumen de asistencia mensual por alumno
CREATE OR REPLACE VIEW v_asistencia_mensual AS
SELECT
  a.alumno_id,
  al.nombre,
  al.apellido,
  EXTRACT(YEAR FROM a.fecha)::INT AS anio,
  EXTRACT(MONTH FROM a.fecha)::INT AS mes,
  COUNT(*) FILTER (WHERE a.estado = 'presente') AS dias_presentes,
  COUNT(*) FILTER (WHERE a.estado = 'ausente') AS dias_ausentes,
  COUNT(*) FILTER (WHERE a.estado = 'ausente_justificado') AS dias_ausentes_justificados,
  COUNT(*) AS total_registros
FROM asistencias a
JOIN alumnos al ON al.id = a.alumno_id
GROUP BY a.alumno_id, al.nombre, al.apellido, EXTRACT(YEAR FROM a.fecha), EXTRACT(MONTH FROM a.fecha);
