import {useCallback, useEffect, useState} from 'react'
import Nav from '../components/Nav'
import Card from '../components/Card'
import {cancelarReservaAdmin, obtenerReporte, obtenerTodasReservas} from '../api'
import {obtenerSesion} from '../auth'
import '../css/admin.css'
import '../css/servicios.css'
import '../css/reservas.css'
import '../css/panel.css'

function Admin() {
    const sesion = obtenerSesion()
    const [reporte, setReporte] = useState(null)
    const [reservas, setReservas] = useState([])
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    const cargar = useCallback(async () => {
        try {
            const dataReporte = await obtenerReporte(sesion.token)
            setReporte(dataReporte)
            const dataReservas = await obtenerTodasReservas(sesion.token)
            setReservas(dataReservas)
        } catch (err) {
            setError(err.message)
        }
    }, [sesion.token])

    useEffect(() => {
        async function cargarInicial() {
            await cargar()
        }

        cargarInicial()
    }, [cargar])

    async function manejarCancelar(reserva) {
        if (!window.confirm(`¿Cancelar la reserva de ${reserva.pacienteNombre}?`)) return

        setError('')
        setMensaje('')

        try {
            await cancelarReservaAdmin(sesion.token, reserva.id)
            setMensaje('Reserva cancelada correctamente')
            await cargar()
        } catch (err) {
            setError(err.message)
        }
    }

    function contarEstado(estado) {
        if (!reporte) return 0
        const fila = reporte.porEstado.find((e) => e.etiqueta === estado)
        return fila ? fila.total : 0
    }

    function formatearFecha(texto) {
        return new Date(texto).toLocaleString('es-PE', {
            dateStyle: 'medium',
            timeStyle: 'short',
        })
    }

    const maximo = reporte && reporte.porServicio.length > 0
        ? Math.max(...reporte.porServicio.map((s) => s.total))
        : 1

    return (
        <div className="dash">
            <Nav nombre={`${sesion.nombre} ${sesion.apellido}`} rol={sesion.rol}/>

            <div className="main">
                <div className="head">
                    <h1>Panel de administrador</h1>
                </div>

                {error && <p className="error">{error}</p>}
                {mensaje && <p className="exito">{mensaje}</p>}

                <div className="grid">
                    <Card titulo="Total de reservas" valor={String(reporte ? reporte.totalReservas : 0)}/>
                    <Card titulo="Pendientes" valor={String(contarEstado('PENDIENTE'))}/>
                    <Card titulo="Canceladas" valor={String(contarEstado('CANCELADA'))}/>
                </div>

                <div className="box">
                    <h2 className="titulo-form">Reservas por servicio</h2>

                    {!reporte || reporte.porServicio.length === 0 ? (
                        <p className="vacio">Aún no hay reservas registradas.</p>
                    ) : (
                        <div className="barras">
                            {reporte.porServicio.map((s) => (
                                <div className="barra-fila" key={s.etiqueta}>
                                    <span className="barra-nombre">{s.etiqueta}</span>
                                    <div className="barra-fondo">
                                        <div
                                            className="barra-relleno"
                                            style={{width: `${(s.total / maximo) * 100}%`}}
                                        />
                                    </div>
                                    <span className="barra-total">{s.total}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="box tabla-scroll" style={{marginTop: 24}}>
                    <h2 className="titulo-form">Todas las reservas</h2>

                    {reservas.length === 0 ? (
                        <p className="vacio">Aún no hay reservas.</p>
                    ) : (
                        <table>
                            <thead>
                            <tr>
                                <th>Paciente</th>
                                <th>Correo</th>
                                <th>Servicio</th>
                                <th>Médico</th>
                                <th>Sede</th>
                                <th>Fecha y hora</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {reservas.map((r) => (
                                <tr key={r.id}>
                                    <td>{r.pacienteNombre}</td>
                                    <td>{r.pacienteCorreo}</td>
                                    <td>{r.servicioNombre}</td>
                                    <td>{r.medicoNombre || 'Sin médico asignado'}</td>
                                    <td>{r.sede || 'Por confirmar'}</td>
                                    <td>{formatearFecha(r.fechaHora)}</td>
                                    <td>
                                        <span
                                            className={r.estado === 'PENDIENTE' ? 'estado pendiente' : 'estado inactivo'}>
                                            {r.estado === 'PENDIENTE' ? 'Pendiente' : 'Cancelada'}
                                        </span>
                                    </td>
                                    <td>
                                        {r.estado === 'PENDIENTE' && (
                                            <button className="btn btn-chico btn-secundario"
                                                    onClick={() => manejarCancelar(r)}>
                                                Cancelar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Admin