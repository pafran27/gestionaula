import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Alumnos from './pages/Alumnos'
import AlumnoDetalle from './pages/AlumnoDetalle'
import Asistencia from './pages/Asistencia'
import DiasNoHabiles from './pages/DiasNoHabiles'
import Estadisticas from './pages/Estadisticas'
import Competencias from './pages/Competencias'
import Calificaciones from './pages/Calificaciones'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/alumnos" element={<Alumnos />} />
          <Route path="/alumnos/nuevo" element={<AlumnoDetalle />} />
          <Route path="/alumnos/:id" element={<AlumnoDetalle />} />
          <Route path="/asistencia" element={<Asistencia />} />
          <Route path="/dias-no-habiles" element={<DiasNoHabiles />} />
          <Route path="/estadisticas" element={<Estadisticas />} />
          <Route path="/competencias" element={<Competencias />} />
          <Route path="/calificaciones" element={<Calificaciones />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
