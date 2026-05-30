-- Seed: Luis Fabricio Yair — DNI 54748504
-- Correr en Supabase SQL Editor

WITH alumno_nuevo AS (
  INSERT INTO alumnos (nombre, apellido, dni, fecha_nacimiento, sexo, nacionalidad, fecha_ingreso, domicilio)
  VALUES (
    'Fabricio Yair',
    'Luis',
    '54748504',
    '2015-05-29',
    'M',
    'Argentina',
    '2021-03-01',
    'Belgrano S/N, Libertad - Mayor Vicente Villafañe, Pirane, Formosa'
  )
  RETURNING id
),
tutor_padre AS (
  INSERT INTO tutores (alumno_id, nombre, apellido, relacion, telefono, fecha_nacimiento, sexo, nacionalidad, domicilio)
  SELECT id, 'Fredi', 'Luis', 'Padre', '', '1996-01-01', 'M', 'Argentina', 'Mayor Vicente Villafañe, Pirane, Formosa'
  FROM alumno_nuevo
  RETURNING alumno_id
)
INSERT INTO tutores (alumno_id, nombre, apellido, relacion, telefono, fecha_nacimiento, sexo, nacionalidad, domicilio)
SELECT alumno_id, 'Mariana Bernarda', 'Rivero', 'Madre', '', '1998-01-01', 'F', 'Argentina', 'Mayor Vicente Villafañe, Pirane, Formosa'
FROM tutor_padre;
