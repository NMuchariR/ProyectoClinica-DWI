import {useEffect, useMemo, useState} from 'react'
import {Link} from 'react-router-dom'
import Nav from '../components/Nav'
import {obtenerMisReservas} from '../api'
import {obtenerSesion} from '../auth'
import '../css/admin.css'
import '../css/reservas.css'
import '../css/calendario.css'

const FORMATO_MES = new Intl.DateTimeFormat('es-PE', {month: 'long', year: 'numeric'})

function claveFecha(fecha) {
    const year = fecha.getFullYear()
    const month = String(fecha.getMonth() + 1).padStart(2, '0')
    const day = String(fecha.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}

function formatearCita(fechaHora) {
    return new Date(fechaHora).toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

function PacienteCalendario() {
    const sesion = obtenerSesion()
    const [reservas, setReservas] = useState([])
    const [mesActual, setMesActual] = useState(() => {
        const hoy = new Date()
        return new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    })
    const [fechaElegida, setFechaElegida] = useState(() => claveFecha(new Date()))
    const [error, setError] = useState('')

    useEffect(() => {
        obtenerMisReservas(sesion.token)
            .then(setReservas)
            .catch((err) => setError(err.message))
    }, [sesion.token])

    const dias = useMemo(() => {
        const primerDia = new Date(mesActual.getFullYear(), mesActual.getMonth(), 1)
        const desplazamiento = (primerDia.getDay() + 6) % 7
        const cantidadDias = new Date(mesActual.getFullYear(), mesActual.getMonth() + 1, 0).getDate()
        const celdas = Array.from({length: 42}, (_, indice) => {
            const diaNumero = indice - desplazamiento + 1
            if (diaNumero < 1 || diaNumero > cantidadDias) return null
            const fecha = new Date(mesActual.getFullYear(), mesActual.getMonth(), diaNumero)
            return {numero: diaNumero, fecha, clave: claveFecha(fecha)}
        })
        return celdas
    }, [mesActual])

    const reservasPorDia = useMemo(() => {
        const agrupadas = new Map()
        reservas.forEach((reserva) => {
            const fecha = claveFecha(new Date(reserva.fechaHora))
            agrupadas.set(fecha, [...(agrupadas.get(fecha) || []), reserva])
        })
        return agrupadas
    }, [reservas])

    const reservasDelDia = (reservasPorDia.get(fechaElegida) || [])
        .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
    const citasFuturas = reservas
        .filter((reserva) => reserva.estado === 'PENDIENTE' && new Date(reserva.fechaHora) >= new Date())
        .sort((a, b) => new Date(a.fechaHora) - new Date(b.fechaHora))
    const hoy = claveFecha(new Date())

    function cambiarMes(cantidad) {
        setMesActual((actual) => new Date(actual.getFullYear(), actual.getMonth() + cantidad, 1))
    }

    function elegirDia(dia) {
        setFechaElegida(dia.clave)
    }

    return (
        <div className="dash">
            <Nav nombre={`${sesion.nombre} ${sesion.apellido}`} rol={sesion.rol}/>
            <main className="main">
                <header className="head calendario-cabecera">
                    <div>
                        <h1>Calendario de citas</h1>
                        <p>Consulta tus citas programadas y las reservas de otros días.</p>
                    </div>
                    <Link className="btn" to="/paciente/reservas">Reservar una cita</Link>
                </header>

                {error && <p className="error" role="alert">{error}</p>}

                <div className="calendario-layout">
                    <section className="box calendario-mes" aria-label="Calendario mensual">
                        <div className="calendario-navegacion">
                            <button className="btn btn-secundario calendario-flecha" type="button"
                                aria-label="Mes anterior" onClick={() => cambiarMes(-1)}>‹</button>
                            <h2>{FORMATO_MES.format(mesActual)}</h2>
                            <button className="btn btn-secundario calendario-flecha" type="button"
                                aria-label="Mes siguiente" onClick={() => cambiarMes(1)}>›</button>
                        </div>

                        <div className="calendario-cuadricula">
                            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((dia) => (
                                <span className="calendario-dia-semana" key={dia}>{dia}</span>
                            ))}
                            {dias.map((dia, indice) => {
                                if (!dia) return <span className="calendario-vacio" key={`vacio-${indice}`}/>
                                const delDia = reservasPorDia.get(dia.clave) || []
                                const tienePendientes = delDia.some((reserva) => reserva.estado === 'PENDIENTE')
                                return (
                                    <button
                                        className={[
                                            'calendario-dia',
                                            fechaElegida === dia.clave ? 'seleccionado' : '',
                                            hoy === dia.clave ? 'hoy' : '',
                                        ].filter(Boolean).join(' ')}
                                        key={dia.clave}
                                        type="button"
                                        aria-label={`${dia.numero}, ${delDia.length} citas`}
                                        aria-pressed={fechaElegida === dia.clave}
                                        onClick={() => elegirDia(dia)}
                                    >
                                        <span>{dia.numero}</span>
                                        {delDia.length > 0 && (
                                            <span className={`calendario-marca ${tienePendientes ? '' : 'cancelada'}`}>
                                                {delDia.length}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                        <div className="calendario-leyenda">
                            <span><i/> Día con cita registrada</span>
                            <span><i className="cancelada"/> Solo citas canceladas</span>
                        </div>
                    </section>

                    <aside className="box calendario-detalle">
                        <p className="reserva-etiqueta">CITAS DEL DÍA</p>
                        <h2>{new Date(`${fechaElegida}T12:00:00`).toLocaleDateString('es-PE', {
                            weekday: 'long', day: 'numeric', month: 'long',
                        })}</h2>
                        {reservasDelDia.length === 0 ? (
                            <p className="vacio">No tienes citas registradas para este día.</p>
                        ) : (
                            <div className="calendario-lista">
                                {reservasDelDia.map((reserva) => (
                                    <article className="calendario-cita" key={reserva.id}>
                                        <strong>
                                            {new Date(reserva.fechaHora).toLocaleTimeString('es-PE', {
                                                hour: '2-digit', minute: '2-digit',
                                            })}
                                        </strong>
                                        <div>
                                            <h3>{reserva.servicioNombre}</h3>
                                            <p>{reserva.medicoNombre} · {reserva.medicoEspecialidad || 'Consulta'}</p>
                                            {reserva.sede && <p>{reserva.sede}</p>}
                                            <p>{formatearCita(reserva.fechaHora)}</p>
                                            <span className={`estado ${reserva.estado === 'PENDIENTE' ? 'pendiente' : 'inactivo'}`}>
                                                {reserva.estado === 'PENDIENTE' ? 'Pendiente' : 'Cancelada'}
                                            </span>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </aside>
                </div>

                <section className="box calendario-proximas">
                    <h2 className="titulo-form">Próximas citas</h2>
                    {citasFuturas.length === 0 ? (
                        <p className="vacio">No tienes citas próximas. Puedes reservar desde aquí.</p>
                    ) : (
                        <div className="calendario-lista-proximas">
                            {citasFuturas.slice(0, 5).map((reserva) => (
                                <button className="calendario-proxima" type="button" key={reserva.id}
                                    onClick={() => {
                                        const fecha = new Date(reserva.fechaHora)
                                        setMesActual(new Date(fecha.getFullYear(), fecha.getMonth(), 1))
                                        setFechaElegida(claveFecha(fecha))
                                    }}>
                                    <span>{formatearCita(reserva.fechaHora)}</span>
                                    <strong>{reserva.servicioNombre} · {reserva.medicoNombre} · {reserva.sede || 'Sede por confirmar'}</strong>
                                </button>
                            ))}
                        </div>
                    )}
                </section>
            </main>
        </div>
    )
}

export default PacienteCalendario
