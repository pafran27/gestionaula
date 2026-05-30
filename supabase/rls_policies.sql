-- Políticas RLS para rol anon (sin autenticación por ahora)
-- Permite todas las operaciones desde la app

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
