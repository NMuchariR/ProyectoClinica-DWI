import {useEffect, useState} from 'react'
import {Link} from 'react-router-dom'
import Nav from '../components/Nav'
import {obtenerMisReservas} from '../api'
import {obtenerSesion} from '../auth'
import '../css/admin.css'
import '../css/patient.css'

function formatearFecha(fecha) {
    return new Date(fecha).toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

function Patient() {
    const sesion = obtenerSesion()
    const [reservas, setReservas] = useState([])
    const [error, setError] = useState('')

    useEffect(() => {
        obtenerMisReservas(sesion.token)
            .then(setReservas)
            .catch((err) => setError(err.message))
    }, [sesion.token])

    const proximasReservas = reservas
        .filter((reserva) => reserva.estado === 'PENDIENTE' && new Date(reserva.fechaHora) > new Date())
        .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
    const citasRecientes = [...reservas]
        .sort((a, b) => new Date(b.fechaHora) - new Date(a.fechaHora))
        .slice(0, 4)
    const siguienteCita = proximasReservas[0]

    return (
        <div className="dash">
            <Nav nombre={`${sesion.nombre} ${sesion.apellido}`} rol={sesion.rol}/>

            <main className="main paciente-inicio">
                <header className="paciente-bienvenida">
                    <div>
                        <p className="paciente-etiqueta">INICIO / PACIENTE</p>
                        <h1>Hola, {sesion.nombre}</h1>
                        <p>Consulta tus reservas y organiza tu próxima visita.</p>
                    </div>
                    <Link className="btn" to="/paciente/reservas">+ Reservar una cita</Link>
                </header>

                {error && <p className="error" role="alert">{error}</p>}

                <section className="paciente-resumen" aria-label="Resumen de tu cuenta">
                    <article className="box paciente-indicador">
                        <p>Próximas citas</p>
                        <strong>{proximasReservas.length}</strong>
                        <span>{siguienteCita ? formatearFecha(siguienteCita.fechaHora) : 'No tienes citas próximas'}</span>
                    </article>
                    <article className="box paciente-indicador">
                        <p>Reservas registradas</p>
                        <strong>{reservas.length}</strong>
                        <span>Incluye tus reservas anteriores</span>
                    </article>
                    <article className="box paciente-indicador">
                        <p>Correo de contacto</p>
                        <strong className="paciente-correo">{sesion.correo}</strong>
                        <span>Asociado a tu cuenta</span>
                    </article>
                </section>

                <section className="paciente-destacado">
                    <article className="box paciente-proxima">
                        <h2>Tu próxima cita</h2>
                        {siguienteCita ? (
                            <div className="paciente-cita-detalle">
                                <div className="paciente-fecha">
                                    <span>{new Date(siguienteCita.fechaHora).toLocaleDateString('es-PE', {month: 'short'}).toUpperCase()}</span>
                                    <strong>{new Date(siguienteCita.fechaHora).getDate()}</strong>
                                    <span>{new Date(siguienteCita.fechaHora).toLocaleDateString('es-PE', {weekday: 'long'})}</span>
                                </div>
                                <div className="paciente-cita-info">
                                    <h3>{siguienteCita.medicoNombre || 'Médico por asignar'}</h3>
                                    <p>{siguienteCita.medicoEspecialidad || 'Consulta médica'} · {siguienteCita.servicioNombre}</p>
                                    <strong>{formatearFecha(siguienteCita.fechaHora)}</strong>
                                    {siguienteCita.sede && <p>{siguienteCita.sede}</p>}
                                    {siguienteCita.motivoConsulta &&
                                        <p className="paciente-motivo">Motivo: {siguienteCita.motivoConsulta}</p>}
                                </div>
                            </div>
                        ) : (
                            <div className="paciente-sin-cita">
                                <p>No tienes citas próximas. Cuando reserves, aquí verás los detalles de tu visita.</p>
                                <Link className="btn btn-secundario" to="/paciente/reservas">Ver disponibilidad</Link>
                            </div>
                        )}
                    </article>

                    <aside className="box paciente-atajo">
                        <p className="paciente-etiqueta">RESERVAS</p>
                        <h2>Encuentra un horario disponible</h2>
                        <p>Elige el servicio, la sede, el profesional y el horario que mejor te convenga.</p>
                        <Link className="btn" to="/paciente/reservas">Empezar una reserva</Link>
                    </aside>
                </section>

                <section className="box paciente-historial">
                    <div className="paciente-seccion-cabecera">
                        <h2>Resumen de tus reservas</h2>
                        <Link to="/paciente/reservas">Ver todas →</Link>
                    </div>
                    {citasRecientes.length === 0 ? (
                        <p className="vacio">Aún no tienes reservas registradas.</p>
                    ) : (
                        <div className="paciente-lista-reservas">
                            {citasRecientes.map((reserva) => (
                                <div className="paciente-fila-reserva" key={reserva.id}>
                                    <span>{formatearFecha(reserva.fechaHora)}</span>
                                    <span>
                                        {reserva.medicoNombre || 'Médico por asignar'} · {reserva.servicioNombre}
                                        {reserva.sede ? ` · ${reserva.sede}` : ''}
                                    </span>
                                    <span className={`paciente-estado ${reserva.estado === 'PENDIENTE' ? 'pendiente' : 'cancelada'}`}>
                                        {reserva.estado === 'PENDIENTE' ? 'Pendiente' : 'Cancelada'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}

export default Patient
