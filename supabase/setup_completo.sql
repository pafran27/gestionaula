-- PASO 1: Crear tablas de calificaciones
CREATE TABLE IF NOT EXISTS calificaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  materia TEXT NOT NULL,
  trimestre TEXT NOT NULL CHECK (trimestre IN ('T1', 'T2', 'T3')),
  anio INT NOT NULL,
  nombre_examen TEXT NOT NULL,
  nota NUMERIC(4,2) NOT NULL CHECK (nota >= 1 AND nota <= 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- PASO 2: Activar RLS y crear políticas para todas las tablas
ALTER TABLE alumnos ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutores ENABLE ROW LEVEL SECURITY;
ALTER TABLE asistencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE dias_no_habiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE competencias_socioafectivas ENABLE ROW LEVEL SECURITY;
ALTER TABLE calificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE promedios_trimestre ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anon_all" ON alumnos FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON tutores FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON asistencias FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON dias_no_habiles FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON competencias_socioafectivas FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON calificaciones FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon_all" ON promedios_trimestre FOR ALL TO anon USING (true) WITH CHECK (true);
