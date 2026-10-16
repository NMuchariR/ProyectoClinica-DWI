import {useCallback, useEffect, useState} from 'react'
import Nav from '../components/Nav'
import {actualizarServicio, crearServicio, eliminarServicio, obtenerServicios} from '../api'
import {obtenerSesion} from '../auth'
import '../css/admin.css'
import '../css/servicios.css'

const FORMULARIO_VACIO = {
    nombre: '',
    especialidad: '',
    descripcion: '',
    precio: '',
    duracionMinutos: '',
    activo: true,
}

function AdminServicios() {
    const sesion = obtenerSesion()
    const [servicios, setServicios] = useState([])
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
    const [editandoId, setEditandoId] = useState(null)
    const [errores, setErrores] = useState({})
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    const cargar = useCallback(async () => {
        try {
            const data = await obtenerServicios(sesion.token)
            setServicios(data)
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

    function manejarCambio(e) {
        const {name, value, type, checked} = e.target
        setFormulario({
            ...formulario,
            [name]: type === 'checkbox' ? checked : value,
        })
    }

    function validar() {
        const nuevos = {}

        if (!formulario.nombre.trim()) {
            nuevos.nombre = 'El nombre es obligatorio'
        } else if (formulario.nombre.length > 100) {
            nuevos.nombre = 'El nombre no puede pasar de 100 caracteres'
        }

        if (formulario.descripcion.length > 500) {
            nuevos.descripcion = 'La descripción no puede pasar de 500 caracteres'
        }

        if (!formulario.especialidad.trim()) {
            nuevos.especialidad = 'La especialidad es obligatoria'
        } else if (formulario.especialidad.length > 100) {
            nuevos.especialidad = 'La especialidad no puede pasar de 100 caracteres'
        }

        if (formulario.precio === '' || Number(formulario.precio) <= 0) {
            nuevos.precio = 'El precio debe ser mayor a 0'
        }

        if (formulario.duracionMinutos === '' ||
            !Number.isInteger(Number(formulario.duracionMinutos)) ||
            Number(formulario.duracionMinutos) <= 0) {
            nuevos.duracionMinutos = 'La duración debe ser un número entero mayor a 0'
        }

        setErrores(nuevos)
        return Object.keys(nuevos).length === 0
    }

    async function manejarEnvio(e) {
        e.preventDefault()
        setError('')
        setMensaje('')

        if (!validar()) return

        const datos = {
            nombre: formulario.nombre.trim(),
            especialidad: formulario.especialidad.trim(),
            descripcion: formulario.descripcion.trim(),
            precio: Number(formulario.precio),
            duracionMinutos: Number(formulario.duracionMinutos),
            activo: formulario.activo,
        }

        try {
            if (editandoId) {
                await actualizarServicio(sesion.token, editandoId, datos)
                setMensaje('Servicio actualizado correctamente')
            } else {
                await crearServicio(sesion.token, datos)
                setMensaje('Servicio creado correctamente')
            }
            cancelarEdicion()
            await cargar()
        } catch (err) {
            setError(err.message)
        }
    }

    function empezarEdicion(servicio) {
        setEditandoId(servicio.id)
        setFormulario({
            nombre: servicio.nombre,
            especialidad: servicio.especialidad || '',
            descripcion: servicio.descripcion || '',
            precio: servicio.precio,
            duracionMinutos: servicio.duracionMinutos,
            activo: servicio.activo,
        })
        setErrores({})
        setError('')
        setMensaje('')
    }

    function cancelarEdicion() {
        setEditandoId(null)
        setFormulario(FORMULARIO_VACIO)
        setErrores({})
    }

    async function manejarEliminar(servicio) {
        if (!window.confirm(`¿Eliminar el servicio "${servicio.nombre}"?`)) return

        setError('')
        setMensaje('')

        try {
            await eliminarServicio(sesion.token, servicio.id)
            setMensaje('Servicio eliminado correctamente')
            await cargar()
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="dash">
            <Nav nombre={`${sesion.nombre} ${sesion.apellido}`} rol={sesion.rol}/>

            <div className="main">
                <div className="head">
                    <h1>Gestión de servicios</h1>
                </div>

                <div className="box">
                    <h2 className="titulo-form">
                        {editandoId ? 'Editar servicio' : 'Nuevo servicio'}
                    </h2>

                    <form className="form-servicio" onSubmit={manejarEnvio} noValidate>
                        <div className="campo">
                            <label>Nombre</label>
                            <input
                                type="text"
                                name="nombre"
                                value={formulario.nombre}
                                onChange={manejarCambio}
                            />
                            {errores.nombre && <span className="error-campo">{errores.nombre}</span>}
                        </div>

                        <div className="campo">
                            <label>Precio (S/)</label>
                            <input
                                type="number"
                                step="0.01"
                                name="precio"
                                value={formulario.precio}
                                onChange={manejarCambio}
                            />
                            {errores.precio && <span className="error-campo">{errores.precio}</span>}
                        </div>

                        <div className="campo">
                            <label>Especialidad</label>
                            <input
                                type="text"
                                name="especialidad"
                                value={formulario.especialidad}
                                onChange={manejarCambio}
                            />
                            {errores.especialidad &&
                                <span className="error-campo">{errores.especialidad}</span>}
                        </div>

                        <div className="campo">
                            <label>Duración (minutos)</label>
                            <input
                                type="number"
                                name="duracionMinutos"
                                value={formulario.duracionMinutos}
                                onChange={manejarCambio}
                            />
                            {errores.duracionMinutos &&
                                <span className="error-campo">{errores.duracionMinutos}</span>}
                        </div>

                        <div className="campo campo-check">
                            <label>
                                <input
                                    type="checkbox"
                                    name="activo"
                                    checked={formulario.activo}
                                    onChange={manejarCambio}
                                />
                                Servicio activo
                            </label>
                        </div>

                        <div className="campo campo-ancho">
                            <label>Descripción</label>
                            <textarea
                                name="descripcion"
                                rows="3"
                                value={formulario.descripcion}
                                onChange={manejarCambio}
                            />
                            {errores.descripcion &&
                                <span className="error-campo">{errores.descripcion}</span>}
                        </div>

                        <div className="acciones campo-ancho">
                            <button className="btn" type="submit">
                                {editandoId ? 'Guardar cambios' : 'Crear servicio'}
                            </button>
                            {editandoId && (
                                <button className="btn btn-secundario" type="button" onClick={cancelarEdicion}>
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {mensaje && <p className="exito">{mensaje}</p>}
                {error && <p className="error">{error}</p>}

                <div className="box tabla-scroll" style={{marginTop: 24}}>
                    <table>
                        <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Especialidad</th>
                            <th>Descripción</th>
                            <th>Precio</th>
                            <th>Duración</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {servicios.map((s) => (
                            <tr key={s.id}>
                                <td>{s.nombre}</td>
                                <td>{s.especialidad || 'Sin configurar'}</td>
                                <td>{s.descripcion}</td>
                                <td>S/ {Number(s.precio).toFixed(2)}</td>
                                <td>{s.duracionMinutos} min</td>
                                <td>
                                    <span className={s.activo ? 'estado activo' : 'estado inactivo'}>
                                        {s.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </td>
                                <td className="celda-acciones">
                                    <button className="btn btn-chico" onClick={() => empezarEdicion(s)}>
                                        Editar
                                    </button>
                                    <button className="btn btn-chico btn-secundario"
                                            onClick={() => manejarEliminar(s)}>
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

export default AdminServicios