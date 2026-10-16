import {useCallback, useEffect, useState} from 'react'
import Nav from '../components/Nav'
import {
    cancelarReserva,
    crearReserva,
    obtenerHorariosDisponibles,
    obtenerMedicos,
    obtenerMedicosDisponibles,
    obtenerMisReservas,
    obtenerServicios,
} from '../api'
import {obtenerSesion} from '../auth'
import '../css/admin.css'
import '../css/servicios.css'
import '../css/reservas.css'

function obtenerFechaLocal() {
    const fecha = new Date()
    fecha.setMinutes(fecha.getMinutes() - fecha.getTimezoneOffset())
    return fecha.toISOString().slice(0, 10)
}

function mostrarHora(hora) {
    return hora.slice(0, 5)
}

function mostrarFecha(fechaHora) {
    return new Date(fechaHora).toLocaleString('es-PE', {
        dateStyle: 'full',
        timeStyle: 'short',
    })
}

function PacienteReservas() {
    const sesion = obtenerSesion()
    const [servicios, setServicios] = useState([])
    const [sedes, setSedes] = useState([])
    const [horarios, setHorarios] = useState({clave: '', items: [], buscando: false})
    const [disponibilidad, setDisponibilidad] = useState({clave: '', medicos: [], buscando: false})
    const [reservas, setReservas] = useState([])
    const [servicioId, setServicioId] = useState('')
    const [sede, setSede] = useState('')
    const [medicoId, setMedicoId] = useState('')
    const [fecha, setFecha] = useState('')
    const [hora, setHora] = useState('')
    const [motivoConsulta, setMotivoConsulta] = useState('')
    const [errores, setErrores] = useState({})
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [paso, setPaso] = useState('seleccion')
    const [reservaConfirmada, setReservaConfirmada] = useState(null)
    const [guardando, setGuardando] = useState(false)

    const cargarReservas = useCallback(async () => {
        try {
            setReservas(await obtenerMisReservas(sesion.token))
        } catch (err) {
            setError(err.message)
        }
    }, [sesion.token])

    useEffect(() => {
        async function cargarInicial() {
            try {
                const dataServicios = await obtenerServicios(sesion.token)
                setServicios(dataServicios.filter((servicio) => servicio.activo && servicio.especialidad))
                const medicos = await obtenerMedicos(sesion.token)
                setSedes([...new Set(medicos.map((medico) => medico.sede).filter(Boolean))].sort())
                await cargarReservas()
            } catch (err) {
                setError(err.message)
            }
        }

        cargarInicial()
    }, [sesion.token, cargarReservas])

    const claveHorarios = `${servicioId}|${sede}|${fecha}`
    const horariosActuales = horarios.clave === claveHorarios ? horarios : null
    const listaHorarios = horariosActuales?.items ?? []
    const buscandoHorarios = horariosActuales?.buscando ?? false

    useEffect(() => {
        if (!sede || !servicioId || !fecha) return

        let vigente = true
        async function cargarHorarios() {
            setHorarios({clave: claveHorarios, items: [], buscando: true})
            try {
                const items = await obtenerHorariosDisponibles(
                    sesion.token, fecha, servicioId, sede,
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
    }, [sesion.token, servicioId, sede, fecha, claveHorarios])

    const claveDisponibilidad = `${claveHorarios}|${hora}`
    const disponibilidadActual = disponibilidad.clave === claveDisponibilidad ? disponibilidad : null
    const medicosDisponibles = disponibilidadActual?.medicos ?? []
    const buscandoMedicos = disponibilidadActual?.buscando ?? false

    useEffect(() => {
        if (!sede || !servicioId || !fecha || !hora) return

        let vigente = true
        async function cargarMedicosDisponibles() {
            setDisponibilidad({clave: claveDisponibilidad, medicos: [], buscando: true})
            try {
                const items = await obtenerMedicosDisponibles(
                    sesion.token, fecha, hora, servicioId, sede,
                )
                if (vigente) setDisponibilidad({clave: claveDisponibilidad, medicos: items, buscando: false})
            } catch (err) {
                if (vigente) setError(err.message)
            } finally {
                if (vigente) setDisponibilidad((actual) =>
                    actual.clave === claveDisponibilidad ? {...actual, buscando: false} : actual,
                )
            }
        }

        cargarMedicosDisponibles()
        return () => {
            vigente = false
        }
    }, [sesion.token, servicioId, sede, fecha, hora, claveDisponibilidad])

    const servicioSeleccionado = servicios.find((servicio) => String(servicio.id) === servicioId)
    const medicoSeleccionado = medicosDisponibles.find((medico) => String(medico.id) === medicoId)

    function cambiarCriterio(actualizar) {
        actualizar()
        setHora('')
        setMedicoId('')
        setErrores({})
    }

    function validar() {
        const nuevos = {}

        if (!servicioId) nuevos.servicioId = 'Debes elegir un servicio'
        if (!sedes.includes(sede)) nuevos.sede = 'Debes elegir una sede'
        if (!fecha || !hora || !listaHorarios.some((horario) => mostrarHora(horario) === hora)) {
            nuevos.fechaHora = 'Elige una fecha y uno de los horarios disponibles'
        }
        if (!medicoId || !medicosDisponibles.some((medico) => String(medico.id) === medicoId)) {
            nuevos.medicoId = 'Elige un médico disponible para este horario'
        }
        if (!motivoConsulta.trim()) {
            nuevos.motivoConsulta = 'Indica el motivo de la consulta'
        } else if (motivoConsulta.trim().length > 500) {
            nuevos.motivoConsulta = 'El motivo no puede pasar de 500 caracteres'
        }

        setErrores(nuevos)
        return Object.keys(nuevos).length === 0
    }

    function continuarARevision(evento) {
        evento.preventDefault()
        setError('')
        if (validar()) setPaso('revision')
    }

    async function confirmarReserva() {
        setError('')
        setGuardando(true)
        try {
            const nuevaReserva = await crearReserva(sesion.token, {
                servicioId: Number(servicioId),
                medicoId: Number(medicoId),
                sede,
                fechaHora: `${fecha}T${hora}`,
                motivoConsulta: motivoConsulta.trim(),
            })
            setReservaConfirmada(nuevaReserva)
            setPaso('confirmada')
            await cargarReservas()
        } catch (err) {
            setError(err.message)
        } finally {
            setGuardando(false)
        }
    }

    function nuevaReserva() {
        setPaso('seleccion')
        setReservaConfirmada(null)
        setServicioId('')
        setSede('')
        setMedicoId('')
        setFecha('')
        setHora('')
        setMotivoConsulta('')
        setErrores({})
        setError('')
        setMensaje('')
    }

    async function manejarCancelar(reserva) {
        if (!window.confirm(`¿Cancelar tu reserva de "${reserva.servicioNombre}"?`)) return

        setError('')
        setMensaje('')
        try {
            await cancelarReserva(sesion.token, reserva.id)
            setMensaje('Reserva cancelada correctamente')
            await cargarReservas()
        } catch (err) {
            setError(err.message)
        }
    }

    function formatearFecha(texto) {
        return new Date(texto).toLocaleString('es-PE', {
            dateStyle: 'medium',
            timeStyle: 'short',
        })
    }

    const citaMostrada = reservaConfirmada || {}

    return (
        <div className="dash">
            <Nav nombre={`${sesion.nombre} ${sesion.apellido}`} rol={sesion.rol}/>

            <main className="main">
                <div className="head">
                    <h1>Mis reservas</h1>
                    <p>Reserva y consulta tus citas médicas.</p>
                </div>

                {paso === 'seleccion' && (
                    <section className="box reserva-panel">
                        <div className="reserva-titulo">
                            <div>
                                <span className="reserva-etiqueta">RESERVAR CITA</span>
                                <h2 className="titulo-form">Elige tu próxima cita</h2>
                                <p>Selecciona el servicio, el profesional y uno de los horarios disponibles.</p>
                            </div>
                            <span className="reserva-paso">1 de 2 · Selección</span>
                        </div>

                        <form className="form-servicio" onSubmit={continuarARevision} noValidate>
                            <div className="campo">
                                <label htmlFor="servicio-cita">Servicio</label>
                                <select
                                    id="servicio-cita"
                                    value={servicioId}
                                    onChange={(evento) => cambiarCriterio(() => setServicioId(evento.target.value))}
                                >
                                    <option value="">-- Elige un servicio --</option>
                                    {servicios.map((servicio) => (
                                        <option key={servicio.id} value={servicio.id}>
                                            {servicio.nombre} · S/ {Number(servicio.precio).toFixed(2)} · {servicio.duracionMinutos} min
                                        </option>
                                    ))}
                                </select>
                                {errores.servicioId && <span className="error-campo">{errores.servicioId}</span>}
                            </div>

                            <div className="campo">
                                <label htmlFor="sede-cita">Sede de atención</label>
                                <select
                                    id="sede-cita"
                                    value={sede}
                                    onChange={(evento) => cambiarCriterio(() => setSede(evento.target.value))}
                                >
                                    <option value="">-- Elige una sede --</option>
                                    {sedes.map((item) => <option key={item} value={item}>{item}</option>)}
                                </select>
                                {errores.sede && <span className="error-campo">{errores.sede}</span>}
                            </div>

                            <div className="campo campo-ancho">
                                <label htmlFor="fecha-cita">Fecha de la cita</label>
                                <input
                                    id="fecha-cita"
                                    type="date"
                                    value={fecha}
                                    min={obtenerFechaLocal()}
                                    onChange={(evento) => cambiarCriterio(() => setFecha(evento.target.value))}
                                />
                            </div>

                            {servicioId && sede && fecha && (
                                <div className="campo campo-ancho">
                                    <span className="campo-label">Horarios disponibles</span>
                                    {buscandoHorarios ? (
                                        <p className="reserva-ayuda">Consultando disponibilidad...</p>
                                    ) : listaHorarios.length > 0 ? (
                                        <div className="reserva-horarios" role="group" aria-label="Horarios disponibles">
                                            {listaHorarios.map((horario) => {
                                                const horaVisible = mostrarHora(horario)
                                                return (
                                                    <button
                                                        className={`reserva-hora ${hora === horaVisible ? 'seleccionada' : ''}`}
                                                        key={horario}
                                                        type="button"
                                                        aria-pressed={hora === horaVisible}
                                                        onClick={() => {
                                                            setHora(horaVisible)
                                                            setMedicoId('')
                                                            setErrores({})
                                                        }}
                                                    >
                                                        {horaVisible}
                                                    </button>
                                                )
                                            })}
                                        </div>
                                    ) : (
                                        <p className="reserva-ayuda">No hay horarios disponibles para esta fecha y selección.</p>
                                    )}
                                    {errores.fechaHora && <span className="error-campo">{errores.fechaHora}</span>}
                                </div>
                            )}

                            {hora && (
                                <div className="campo campo-ancho">
                                    <label htmlFor="medico-cita">Profesional disponible para las {hora}</label>
                                    <select
                                        id="medico-cita"
                                        value={medicoId}
                                        disabled={buscandoMedicos || medicosDisponibles.length === 0}
                                        onChange={(evento) => setMedicoId(evento.target.value)}
                                    >
                                        <option value="">
                                            {buscandoMedicos ? 'Consultando profesionales...' : '-- Elige un profesional --'}
                                        </option>
                                        {medicosDisponibles.map((medico) => (
                                            <option key={medico.id} value={medico.id}>
                                                {medico.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {buscandoMedicos && <span className="reserva-ayuda">Verificando disponibilidad del profesional...</span>}
                                    {errores.medicoId && <span className="error-campo">{errores.medicoId}</span>}
                                </div>
                            )}

                            <div className="campo campo-ancho">
                                <label htmlFor="motivo-cita">Motivo de la consulta</label>
                                <textarea
                                    id="motivo-cita"
                                    rows="3"
                                    maxLength="500"
                                    value={motivoConsulta}
                                    onChange={(evento) => setMotivoConsulta(evento.target.value)}
                                    placeholder="Describe brevemente el motivo de tu cita"
                                />
                                <span className="reserva-ayuda">Máximo 500 caracteres. No incluyas información sensible.</span>
                                {errores.motivoConsulta && <span className="error-campo">{errores.motivoConsulta}</span>}
                            </div>

                            {servicioSeleccionado && (
                                <div className="reserva-nota campo-ancho">
                                    Duración estimada: {servicioSeleccionado.duracionMinutos} minutos. El precio registrado es S/ {Number(servicioSeleccionado.precio).toFixed(2)}; este flujo no procesa pagos.
                                </div>
                            )}

                            <div className="acciones campo-ancho">
                                <button className="btn" type="submit">Revisar cita</button>
                            </div>
                        </form>
                    </section>
                )}

                {paso === 'revision' && (
                    <section className="box reserva-panel">
                        <div className="reserva-titulo">
                            <div>
                                <span className="reserva-etiqueta">RESERVAR / REVISIÓN</span>
                                <h2 className="titulo-form">Revisa antes de confirmar</h2>
                                <p>La cita todavía no se ha creado. Verifica los datos antes de continuar.</p>
                            </div>
                            <span className="reserva-paso">2 de 2 · Revisión</span>
                        </div>

                        <div className="reserva-revision">
                            <div className="reserva-datos">
                                <h3>Datos de la cita</h3>
                                <dl>
                                    <div><dt>Paciente</dt><dd>{sesion.nombre} {sesion.apellido}</dd></div>
                                    <div><dt>Correo de contacto</dt><dd>{sesion.correo}</dd></div>
                                    <div><dt>Servicio</dt><dd>{servicioSeleccionado?.nombre}</dd></div>
                                    <div><dt>Sede</dt><dd>{sede}</dd></div>
                                    <div><dt>Profesional</dt><dd>{medicoSeleccionado?.nombre}</dd></div>
                                    <div><dt>Fecha y hora</dt><dd>{mostrarFecha(`${fecha}T${hora}`)}</dd></div>
                                    <div><dt>Duración</dt><dd>{servicioSeleccionado?.duracionMinutos} minutos</dd></div>
                                    <div><dt>Precio registrado</dt><dd>S/ {Number(servicioSeleccionado?.precio).toFixed(2)}</dd></div>
                                    <div className="reserva-motivo"><dt>Motivo de consulta</dt><dd>{motivoConsulta}</dd></div>
                                </dl>
                            </div>
                            <div className="reserva-nota">
                                Confirma solo si los datos son correctos. La cita quedará registrada en tu historial.
                            </div>
                        </div>

                        {error && <p className="error" role="alert">{error}</p>}
                        <div className="acciones reserva-acciones">
                            <button className="btn btn-secundario" type="button" onClick={() => setPaso('seleccion')}>
                                Volver y editar
                            </button>
                            <button className="btn" type="button" onClick={confirmarReserva} disabled={guardando}>
                                {guardando ? 'Guardando cita...' : 'Confirmar cita médica'}
                            </button>
                        </div>
                    </section>
                )}

                {paso === 'confirmada' && (
                    <section className="box reserva-confirmacion" aria-live="polite">
                        <div className="reserva-confirmacion-icono" aria-hidden="true">✓</div>
                        <span className="reserva-etiqueta">CITA REGISTRADA</span>
                        <h2>Tu solicitud de cita está registrada</h2>
                        <p>La reserva se guardó correctamente y ya aparece en tu historial, pendiente de atención.</p>
                        <div className="reserva-confirmacion-detalle">
                            {citaMostrada.id && <p><strong>Número de reserva:</strong> #{citaMostrada.id}</p>}
                            <p><strong>Servicio:</strong> {citaMostrada.servicioNombre || servicioSeleccionado?.nombre}</p>
                            <p><strong>Profesional:</strong> {citaMostrada.medicoNombre || medicoSeleccionado?.nombre}</p>
                            <p><strong>Sede:</strong> {citaMostrada.sede || sede}</p>
                            <p><strong>Fecha y hora:</strong> {mostrarFecha(citaMostrada.fechaHora || `${fecha}T${hora}`)}</p>
                            <p><strong>Duración:</strong> {servicioSeleccionado?.duracionMinutos} minutos</p>
                            <p><strong>Correo de contacto:</strong> {sesion.correo}</p>
                            <p><strong>Estado:</strong> Pendiente</p>
                        </div>
                        <div className="acciones">
                            <button className="btn" type="button" onClick={nuevaReserva}>Reservar otra cita</button>
                            <button className="btn btn-secundario" type="button" onClick={() => {
                                document.querySelector('.tabla-scroll')?.scrollIntoView({behavior: 'smooth'})
                            }}>
                                Ver historial
                            </button>
                        </div>
                    </section>
                )}

                {mensaje && <p className="exito" role="status">{mensaje}</p>}
                {error && paso !== 'revision' && <p className="error" role="alert">{error}</p>}

                <section className="box tabla-scroll reserva-historial">
                    <h2 className="titulo-form">Historial de reservas</h2>
                    {reservas.length === 0 ? (
                        <p className="vacio">Aún no tienes reservas.</p>
                    ) : (
                        <table>
                            <thead>
                            <tr>
                                <th>Servicio</th>
                                <th>Médico</th>
                                <th>Sede</th>
                                <th>Fecha y hora</th>
                                <th>Motivo</th>
                                <th>Precio</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                            </thead>
                            <tbody>
                            {reservas.map((reserva) => (
                                <tr key={reserva.id}>
                                    <td>{reserva.servicioNombre}</td>
                                    <td>{reserva.medicoNombre || 'Sin médico asignado'}</td>
                                    <td>{reserva.sede || 'Por confirmar'}</td>
                                    <td>{formatearFecha(reserva.fechaHora)}</td>
                                    <td>{reserva.motivoConsulta || 'No especificado'}</td>
                                    <td>S/ {Number(reserva.servicioPrecio).toFixed(2)}</td>
                                    <td>
                                        <span className={`estado ${reserva.estado === 'PENDIENTE' ? 'pendiente' : 'inactivo'}`}>
                                            {reserva.estado === 'PENDIENTE' ? 'Pendiente' : 'Cancelada'}
                                        </span>
                                    </td>
                                    <td>
                                        {reserva.estado === 'PENDIENTE' && (
                                            <button className="btn btn-chico btn-secundario" type="button"
                                                onClick={() => manejarCancelar(reserva)}>
                                                Cancelar
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    )}
                </section>
            </main>
        </div>
    )
}

export default PacienteReservas
