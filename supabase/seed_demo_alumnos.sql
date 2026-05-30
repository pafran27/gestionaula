-- Seed: 3 alumnos de demo para testing
-- Correr en Supabase SQL Editor

WITH a1 AS (
  INSERT INTO alumnos (nombre, apellido, dni, fecha_nacimiento, sexo, nacionalidad, fecha_ingreso, domicilio)
  VALUES ('Valentina', 'Gomez', '55123401', '2016-03-14', 'F', 'Argentina', '2022-03-01', 'Av. San Martín 456, Pirané, Formosa')
  RETURNING id
),
t1a AS (
  INSERT INTO tutores (alumno_id, nombre, apellido, relacion, telefono, fecha_nacimiento, sexo, nacionalidad, domicilio)
  SELECT id, 'Carlos', 'Gomez', 'Padre', '3718-401234', '1985-07-20', 'M', 'Argentina', 'Av. San Martín 456, Pirané, Formosa'
  FROM a1 RETURNING alumno_id
)
INSERT INTO tutores (alumno_id, nombre, apellido, relacion, telefono, fecha_nacimiento, sexo, nacionalidad, domicilio)
SELECT alumno_id, 'Laura', 'Sosa', 'Madre', '3718-401235', '1988-11-03', 'F', 'Argentina', 'Av. San Martín 456, Pirané, Formosa'
FROM t1a;

WITH a2 AS (
  INSERT INTO alumnos (nombre, apellido, dni, fecha_nacimiento, sexo, nacionalidad, fecha_ingreso, domicilio)
  VALUES ('Mateo Ezequiel', 'Rodriguez', '55234502', '2017-08-22', 'M', 'Argentina', '2023-03-01', 'Belgrano 123, Pirané, Formosa')
  RETURNING id
),
t2a AS (
  INSERT INTO tutores (alumno_id, nombre, apellido, relacion, telefono, fecha_nacimiento, sexo, nacionalidad, domicilio)
  SELECT id, 'Diego', 'Rodriguez', 'Padre', '3718-512300', '1990-02-15', 'M', 'Argentina', 'Belgrano 123, Pirané, Formosa'
  FROM a2 RETURNING alumno_id
)
INSERT INTO tutores (alumno_id, nombre, apellido, relacion, telefono, fecha_nacimiento, sexo, nacionalidad, domicilio)
SELECT alumno_id, 'Mariela', 'Benítez', 'Madre', '3718-512301', '1992-09-28', 'F', 'Argentina', 'Belgrano 123, Pirané, Formosa'
FROM t2a;

WITH a3 AS (
  INSERT INTO alumnos (nombre, apellido, dni, fecha_nacimiento, sexo, nacionalidad, fecha_ingreso, domicilio)
  VALUES ('Sofía Belén', 'Fernandez', '55345603', '2018-01-05', 'F', 'Argentina', '2024-03-01', 'Rivadavia 789, Pirané, Formosa')
  RETURNING id
),
t3a AS (
  INSERT INTO tutores (alumno_id, nombre, apellido, relacion, telefono, fecha_nacimiento, sexo, nacionalidad, domicilio)
  SELECT id, 'Nora', 'Fernandez', 'Madre', '3718-623400', '1994-04-12', 'F', 'Argentina', 'Rivadavia 789, Pirané, Formosa'
  FROM a3 RETURNING alumno_id
)
INSERT INTO tutores (alumno_id, nombre, apellido, relacion, telefono, fecha_nacimiento, sexo, nacionalidad, domicilio)
SELECT alumno_id, 'Héctor', 'Villalba', 'Abuelo', '3718-623401', '1965-06-30', 'M', 'Argentina', 'Rivadavia 789, Pirané, Formosa'
FROM t3a;
