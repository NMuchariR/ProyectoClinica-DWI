import {useCallback, useEffect, useState} from 'react'
import Nav from '../components/Nav'
import {
    actualizarReservaAdmin,
    cancelarReservaAdmin,
    crearReservaAdmin,
    obtenerHorariosDisponibles,
    obtenerMedicos,
    obtenerMedicosDisponibles,
    obtenerServicios,
    obtenerTodasReservas,
    obtenerUsuarios,
} from '../api'
import {obtenerSesion} from '../auth'
import '../css/admin.css'
import '../css/servicios.css'
import '../css/reservas.css'

const FORMULARIO_VACIO = {
    pacienteId: '',
    servicioId: '',
    sede: '',
    medicoId: '',
    fecha: '',
    hora: '',
    motivoConsulta: '',
}

function fechaLocal() {
    const fecha = new Date()
    fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset())
    return fecha.toISOString().slice(0, 10)
}

function horaCorta(hora) {
    return hora.slice(0, 5)
}

function formatoFecha(fechaHora) {
    return new Date(fechaHora).toLocaleString('es-PE', {
        dateStyle: 'medium',
        timeStyle: 'short',
    })
}

function AdminCitas() {
    const sesion = obtenerSesion()
    const [reservas, setReservas] = useState([])
    const [usuarios, setUsuarios] = useState([])
    const [servicios, setServicios] = useState([])
    const [medicos, setMedicos] = useState([])
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
    const [editando, setEditando] = useState(null)
    const [horarios, setHorarios] = useState({clave: '', items: [], buscando: false})
    const [disponibilidad, setDisponibilidad] = useState({clave: '', items: [], buscando: false})
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [guardando, setGuardando] = useState(false)
    const [busquedaPaciente, setBusquedaPaciente] = useState('')

    const cargarDatos = useCallback(async () => {
        try {
            const [listaReservas, listaUsuarios, listaServicios, listaMedicos] = await Promise.all([
                obtenerTodasReservas(sesion.token),
                obtenerUsuarios(sesion.token),
                obtenerServicios(sesion.token),
                obtenerMedicos(sesion.token),
            ])
            setReservas(listaReservas)
            setUsuarios(listaUsuarios.filter((usuario) => usuario.rol === 'PACIENTE'))
            setServicios(listaServicios.filter((servicio) => servicio.activo && servicio.especialidad))
            setMedicos(listaMedicos)
        } catch (err) {
            setError(err.message)
        }
    }, [sesion.token])

    useEffect(() => {
        async function cargarInicial() {
            await cargarDatos()
        }

        cargarInicial()
    }, [cargarDatos])

    const sedes = [...new Set(medicos.map((medico) => medico.sede).filter(Boolean))].sort()
    const claveHorarios = `${formulario.servicioId}|${formulario.sede}|${formulario.fecha}|${editando?.id || ''}`
    const horariosActuales = horarios.clave === claveHorarios ? horarios : null
    const listaHorarios = horariosActuales?.items ?? []
    const buscandoHorarios = horariosActuales?.buscando ?? false

    useEffect(() => {
        if (!formulario.sede || !formulario.servicioId || !formulario.fecha) return
        let vigente = true

        async function cargarHorarios() {
            setHorarios({clave: claveHorarios, items: [], buscando: true})
            try {
                const items = await obtenerHorariosDisponibles(
                    sesion.token, formulario.fecha, formulario.servicioId,
                    formulario.sede, editando?.id,
                )
                if (vigente) setHorarios({clave: claveHorarios, items, buscando: false})
            } catch (err) {
                if (vigente) setError(err.message)
            } finally {
                if (vigente) setHorarios((actual) =>
                    actual.clave === claveHorarios ? {...actual, buscando: false} : actual,
                )
            }
        }

        cargarHorarios()
        return () => {
            vigente = false
        }
    }, [sesion.token, formulario.servicioId, formulario.sede, formulario.fecha, editando?.id, claveHorarios])

    const claveDisponibilidad = `${claveHorarios}|${formulario.hora}`
    const disponibilidadActual = disponibilidad.clave === claveDisponibilidad ? disponibilidad : null
    const medicosDisponibles = disponibilidadActual?.items ?? []
    const buscandoMedicos = disponibilidadActual?.buscando ?? false

    useEffect(() => {
        if (!formulario.sede || !formulario.servicioId || !formulario.fecha || !formulario.hora) return
        let vigente = true

        async function cargarProfesionales() {
            setDisponibilidad({clave: claveDisponibilidad, items: [], buscando: true})
            try {
                const items = await obtenerMedicosDisponibles(
                    sesion.token, formulario.fecha, formulario.hora,
                    formulario.servicioId, formulario.sede, editando?.id,
                )
                if (vigente) setDisponibilidad({clave: claveDisponibilidad, items, buscando: false})
            } catch (err) {
                if (vigente) setError(err.message)
            } finally {
                if (vigente) setDisponibilidad((actual) =>
                    actual.clave === claveDisponibilidad ? {...actual, buscando: false} : actual,
                )
            }
        }

        cargarProfesionales()
        return () => {
            vigente = false
        }
    }, [sesion.token, formulario.servicioId, formulario.sede, formulario.fecha, formulario.hora, editando?.id, claveDisponibilidad])

    const servicioSeleccionado = servicios.find((servicio) => String(servicio.id) === formulario.servicioId)

    function cambiarCriterio(cambios) {
        setFormulario((actual) => ({...actual, ...cambios, hora: '', medicoId: ''}))
    }

    function iniciarNueva() {
        setEditando(null)
        setFormulario(FORMULARIO_VACIO)
        setError('')
        setMensaje('')
    }

    function iniciarEdicion(reserva) {
        if (new Date(reserva.fechaHora) <= new Date()) {
            setError('Solo se pueden modificar citas futuras.')
            return
        }
        setEditando(reserva)
        setFormulario({
            pacienteId: '',
            servicioId: String(reserva.servicioId),
            sede: reserva.sede || medicos.find((medico) => medico.id === reserva.medicoId)?.sede || '',
            medicoId: String(reserva.medicoId || ''),
            fecha: reserva.fechaHora.slice(0, 10),
            hora: reserva.fechaHora.slice(11, 16),
            motivoConsulta: reserva.motivoConsulta || '',
        })
        setError('')
        setMensaje('')
        window.scrollTo({top: 0, behavior: 'smooth'})
    }

    function cancelarEdicion() {
        iniciarNueva()
    }

    async function guardarCita(evento) {
        evento.preventDefault()
        setError('')
        setMensaje('')

        if (!editando && !formulario.pacienteId) {
            setError('Selecciona el paciente para la cita.')
            return
        }
        if (!servicioSeleccionado || !servicioSeleccionado.especialidad || !sedes.includes(formulario.sede)
            || !formulario.fecha || !formulario.hora) {
            setError('Completa servicio, sede, fecha y horario.')
            return
        }
        if (!formulario.medicoId || !medicosDisponibles.some((medico) => String(medico.id) === formulario.medicoId)) {
            setError('Elige un profesional disponible para el horario seleccionado.')
            return
        }
        if (!formulario.motivoConsulta.trim()) {
            setError('Indica el motivo de la consulta.')
            return
        }
        if (new Date(`${formulario.fecha}T${formulario.hora}`) <= new Date()) {
            setError('La fecha y hora deben ser futuras.')
            return
        }

        setGuardando(true)
        try {
            const datos = {
                servicioId: Number(formulario.servicioId),
                medicoId: Number(formulario.medicoId),
                sede: formulario.sede,
                fechaHora: `${formulario.fecha}T${formulario.hora}`,
                motivoConsulta: formulario.motivoConsulta.trim(),
            }
            if (editando) {
                await actualizarReservaAdmin(sesion.token, editando.id, datos)
                setMensaje('Cita modificada correctamente.')
            } else {
                await crearReservaAdmin(sesion.token, formulario.pacienteId, datos)
                setMensaje('Cita agendada correctamente.')
            }
            iniciarNueva()
            await cargarDatos()
        } catch (err) {
            setError(err.message)
        } finally {
            setGuardando(false)
        }
    }

    async function cancelarCita(reserva) {
        if (!window.confirm(`¿Cancelar la cita de ${reserva.pacienteNombre}? Se conservará en el historial como cancelada.`)) return
        setError('')
        setMensaje('')
        try {
            await cancelarReservaAdmin(sesion.token, reserva.id)
            setMensaje('Cita cancelada. Se conserva en el historial.')
            await cargarDatos()
        } catch (err) {
            setError(err.message)
        }
    }

    const reservasRecientes = [...reservas].sort((a, b) =>
        new Date(b.fechaCreacion || b.fechaHora) - new Date(a.fechaCreacion || a.fechaHora),
    )
    const consulta = busquedaPaciente.trim().toLocaleLowerCase('es-PE')
    const reservasVisibles = consulta
        ? reservasRecientes.filter((reserva) =>
            `${reserva.pacienteNombre} ${reserva.pacienteCorreo}`
                .toLocaleLowerCase('es-PE')
                .includes(consulta),
        )
        : reservasRecientes.slice(0, 10)

    return (
        <div className="dash">
            <Nav nombre={`${sesion.nombre} ${sesion.apellido}`} rol={sesion.rol}/>
            <main className="main">
                <header className="head">
                    <h1>Agenda de citas</h1>
                    <p>Agenda citas para pacientes, modifica horarios o cancela reservas.</p>
                </header>

                {mensaje && <p className="exito" role="status">{mensaje}</p>}
                {error && <p className="error" role="alert">{error}</p>}

                <section className="box reserva-panel">
                    <div className="reserva-titulo">
                        <div>
                            <span className="reserva-etiqueta">{editando ? 'MODIFICAR CITA' : 'NUEVA CITA'}</span>
                            <h2 className="titulo-form">{editando ? `Cita de ${editando.pacienteNombre}` : 'Agendar cita para un paciente'}</h2>
                            <p>Los horarios y profesionales se muestran según su disponibilidad.</p>
                        </div>
                    </div>

                    <form className="form-servicio" onSubmit={guardarCita} noValidate>
                        {!editando && (
                            <div className="campo campo-ancho">
                                <label htmlFor="paciente-cita">Paciente</label>
                                <select
                                    id="paciente-cita"
                                    value={formulario.pacienteId}
                                    onChange={(evento) => setFormulario({...formulario, pacienteId: evento.target.value})}
                                >
                                    <option value="">-- Selecciona un paciente --</option>
                                    {usuarios.map((usuario) => (
                                        <option key={usuario.id} value={usuario.id}>
                                            {usuario.nombre} {usuario.apellido} · {usuario.correo}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="campo">
                            <label htmlFor="admin-servicio">Servicio</label>
                            <select
                                id="admin-servicio"
                                value={formulario.servicioId}
                                onChange={(evento) => cambiarCriterio({servicioId: evento.target.value})}
                            >
                                <option value="">-- Selecciona un servicio --</option>
                                {servicios.map((servicio) => (
                                    <option key={servicio.id} value={servicio.id}>
                                        {servicio.nombre} · {servicio.duracionMinutos} min · S/ {Number(servicio.precio).toFixed(2)}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="campo">
                            <label htmlFor="admin-sede">Sede de atención</label>
                            <select
                                id="admin-sede"
                                value={formulario.sede}
                                onChange={(evento) => cambiarCriterio({sede: evento.target.value})}
                            >
                                <option value="">-- Selecciona una sede --</option>
                                {sedes.map((item) => <option key={item} value={item}>{item}</option>)}
                            </select>
                        </div>

                        <div className="campo campo-ancho">
                            <label htmlFor="admin-fecha">Fecha</label>
                            <input
                                id="admin-fecha"
                                type="date"
                                min={fechaLocal()}
                                value={formulario.fecha}
                                onChange={(evento) => cambiarCriterio({fecha: evento.target.value})}
                            />
                        </div>

                        {formulario.sede && formulario.servicioId && formulario.fecha && (
                            <div className="campo campo-ancho">
                                <span className="campo-label">Horarios disponibles</span>
                                {buscandoHorarios ? (
                                    <p className="reserva-ayuda">Consultando horarios...</p>
                                ) : listaHorarios.length ? (
                                    <div className="reserva-horarios" role="group" aria-label="Horarios disponibles">
                                        {listaHorarios.map((hora) => {
                                            const visible = horaCorta(hora)
                                            return (
                                                <button
                                                    className={`reserva-hora ${formulario.hora === visible ? 'seleccionada' : ''}`}
                                                    key={hora}
                                                    type="button"
                                                    aria-pressed={formulario.hora === visible}
                                                    onClick={() => setFormulario({...formulario, hora: visible, medicoId: ''})}
                                                >
                                                    {visible}
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="reserva-ayuda">No hay horarios disponibles para esa fecha.</p>
                                )}
                            </div>
                        )}

                        {formulario.hora && (
                            <div className="campo campo-ancho">
                                <label htmlFor="admin-medico">Profesional para las {formulario.hora}</label>
                                <select
                                    id="admin-medico"
                                    value={formulario.medicoId}
                                    disabled={buscandoMedicos}
                                    onChange={(evento) => setFormulario({...formulario, medicoId: evento.target.value})}
                                >
                                    <option value="">
                                        {buscandoMedicos ? 'Consultando disponibilidad...' : '-- Selecciona un profesional --'}
                                    </option>
                                    {medicosDisponibles.map((medico) => (
                                        <option key={medico.id} value={medico.id}>{medico.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="campo campo-ancho">
                            <label htmlFor="admin-motivo">Motivo de la consulta</label>
                            <textarea
                                id="admin-motivo"
                                rows="3"
                                maxLength="500"
                                value={formulario.motivoConsulta}
                                onChange={(evento) => setFormulario({...formulario, motivoConsulta: evento.target.value})}
                            />
                        </div>

                        <div className="acciones campo-ancho">
                            <button className="btn" type="submit" disabled={guardando}>
                                {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agendar cita'}
                            </button>
                            {editando && (
                                <button className="btn btn-secundario" type="button" onClick={cancelarEdicion}>
                                    Dejar de editar
                                </button>
                            )}
                        </div>
                    </form>
                </section>

                <section className="box tabla-scroll reserva-historial">
                    <div className="admin-citas-cabecera">
                        <div>
                            <h2 className="titulo-form">
                                {consulta ? 'Citas del paciente' : 'Últimos agendamientos'}
                            </h2>
                            <p>
                                {consulta
                                    ? 'Resultados que coinciden con el nombre o correo del paciente.'
                                    : 'Las 10 citas agendadas más recientemente.'}
                            </p>
                        </div>
                        <div className="campo admin-busqueda">
                            <label htmlFor="buscar-paciente-citas">Buscar paciente</label>
                            <input
                                id="buscar-paciente-citas"
                                type="search"
                                value={busquedaPaciente}
                                onChange={(evento) => setBusquedaPaciente(evento.target.value)}
                                placeholder="Nombre, apellido o correo"
                            />
                        </div>
                    </div>
                    {reservasVisibles.length === 0 ? (
                        <p className="vacio">
                            {consulta
                                ? 'No se encontraron citas para ese paciente.'
                                : 'Aún no hay citas registradas.'}
                        </p>
                    ) : (
                        <>
                            {consulta && (
                                <p className="admin-citas-cantidad">
                                    {reservasVisibles.length} cita{reservasVisibles.length === 1 ? '' : 's'} encontrada{reservasVisibles.length === 1 ? '' : 's'}.
                                </p>
                            )}
                        <table>
                            <thead>
                            <tr>
                                <th>Paciente</th>
                                <th>Servicio</th>
                                <th>Profesional</th>
                                <th>Sede</th>
                                <th>Fecha de cita</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {reservasVisibles.map((reserva) => (
                                <tr key={reserva.id}>
                                    <td>{reserva.pacienteNombre}<br/><small>{reserva.pacienteCorreo}</small></td>
                                    <td>{reserva.servicioNombre}</td>
                                    <td>{reserva.medicoNombre || 'Sin asignar'}</td>
                                    <td>{reserva.sede || 'Por confirmar'}</td>
                                    <td>{formatoFecha(reserva.fechaHora)}</td>
                                    <td>
                                        <span className={`estado ${reserva.estado === 'PENDIENTE' ? 'pendiente' : 'inactivo'}`}>
                                            {reserva.estado === 'PENDIENTE' ? 'Pendiente' : 'Cancelada'}
                                        </span>
                                    </td>
                                    <td className="celda-acciones">
                                        {reserva.estado === 'PENDIENTE' && (
                                            <>
                                                <button className="btn btn-chico" type="button" onClick={() => iniciarEdicion(reserva)}>
                                                    Modificar
                                                </button>
                                                <button className="btn btn-chico btn-secundario" type="button" onClick={() => cancelarCita(reserva)}>
                                                    Cancelar
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        </>
                    )}
                </section>
            </main>
        </div>
    )
}

export default AdminCitas
