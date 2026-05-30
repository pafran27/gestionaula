-- Tabla de calificaciones individuales por examen
CREATE TABLE IF NOT EXISTS calificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  materia TEXT NOT NULL,
  trimestre TEXT NOT NULL CHECK (trimestre IN ('T1', 'T2', 'T3')),
  anio INT NOT NULL,
  nombre_examen TEXT NOT NULL,
  nota NUMERIC(4,2) NOT NULL CHECK (nota >= 1 AND nota <= 10),
  tipo TEXT NOT NULL DEFAULT 'escrito' CHECK (tipo IN ('oral', 'escrito', 'trabajo_practico', 'otro')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migración: agregar columna tipo si la tabla ya existe
ALTER TABLE calificaciones ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'escrito' CHECK (tipo IN ('oral', 'escrito', 'trabajo_practico', 'otro'));

-- Tabla de promedios por materia/trimestre (calculados y editables)
CREATE TABLE IF NOT EXISTS promedios_trimestre (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  materia TEXT NOT NULL,
  trimestre TEXT NOT NULL CHECK (trimestre IN ('T1', 'T2', 'T3')),
  anio INT NOT NULL,
  promedio NUMERIC(4,2) NOT NULL CHECK (promedio >= 1 AND promedio <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, materia, trimestre, anio)
);

CREATE INDEX IF NOT EXISTS idx_calificaciones_alumno ON calificaciones(alumno_id);
CREATE INDEX IF NOT EXISTS idx_calificaciones_materia_trim ON calificaciones(materia, trimestre, anio);
CREATE INDEX IF NOT EXISTS idx_promedios_alumno ON promedios_trimestre(alumno_id);
