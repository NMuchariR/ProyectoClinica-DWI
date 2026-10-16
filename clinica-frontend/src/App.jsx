import {Navigate, Route, Routes} from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Admin from './pages/Admin'
import Patient from './pages/Patient'
import Guard from './components/Guard'
import AdminServicios from './pages/AdminServicios'
import PacienteReservas from './pages/PacienteReservas'
import AdminUsuarios from './pages/AdminUsuarios'
import AdminCitas from './pages/AdminCitas'
import PacienteCalendario from './pages/PacienteCalendario'
import PreferenciasVisuales from './components/PreferenciasVisuales'
import './css/temas.css'

function App() {
    return (
        <>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace/>}/>
                <Route path="/login" element={<Login/>}/>
                <Route path="/registro" element={<Register/>}/>

                <Route
                    path="/admin"
                    element={
                        <Guard rolPermitido="ADMINISTRADOR">
                            <Admin/>
                        </Guard>
                    }
                />
                <Route
                    path="/admin/servicios"
                    element={
                        <Guard rolPermitido="ADMINISTRADOR">
                            <AdminServicios/>
                        </Guard>
                    }
                />
                <Route
                    path="/admin/reservas"
                    element={
                        <Guard rolPermitido="ADMINISTRADOR">
                            <AdminCitas/>
                        </Guard>
                    }
                />
                <Route
                    path="/paciente"
                    element={
                        <Guard rolPermitido="PACIENTE">
                            <Patient/>
                        </Guard>
                    }
                />

                <Route
                    path="/paciente/reservas"
                    element={
                        <Guard rolPermitido="PACIENTE">
                            <PacienteReservas/>
                        </Guard>
                    }
                />
                <Route
                    path="/paciente/calendario"
                    element={
                        <Guard rolPermitido="PACIENTE">
                            <PacienteCalendario/>
                        </Guard>
                    }
                />

                <Route
                    path="/admin/usuarios"
                    element={
                        <Guard rolPermitido="ADMINISTRADOR">
                            <AdminUsuarios/>
                        </Guard>
                    }
                />

            </Routes>
            <PreferenciasVisuales/>
        </>
    )
}

export default App