import {useCallback, useEffect, useState} from 'react'
import Nav from '../components/Nav'
import {actualizarUsuario, eliminarUsuario, obtenerUsuarios} from '../api'
import {obtenerSesion} from '../auth'
import '../css/admin.css'
import '../css/servicios.css'
import '../css/reservas.css'

const FORMULARIO_VACIO = {
    nombre: '',
    apellido: '',
    rol: 'PACIENTE',
}

function AdminUsuarios() {
    const sesion = obtenerSesion()
    const [usuarios, setUsuarios] = useState([])
    const [formulario, setFormulario] = useState(FORMULARIO_VACIO)
    const [editandoId, setEditandoId] = useState(null)
    const [errores, setErrores] = useState({})
    const [error, setError] = useState('')
    const [mensaje, setMensaje] = useState('')

    const cargar = useCallback(async () => {
        try {
            const data = await obtenerUsuarios(sesion.token)
            setUsuarios(data)
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
        const {name, value} = e.target
        setFormulario({...formulario, [name]: value})
    }

    function validar() {
        const nuevos = {}

        if (!formulario.nombre.trim()) {
            nuevos.nombre = 'El nombre es obligatorio'
        } else if (formulario.nombre.length > 100) {
            nuevos.nombre = 'El nombre no puede pasar de 100 caracteres'
        }

        if (!formulario.apellido.trim()) {
            nuevos.apellido = 'El apellido es obligatorio'
        } else if (formulario.apellido.length > 100) {
            nuevos.apellido = 'El apellido no puede pasar de 100 caracteres'
        }

        setErrores(nuevos)
        return Object.keys(nuevos).length === 0
    }

    function empezarEdicion(usuario) {
        setEditandoId(usuario.id)
        setFormulario({
            nombre: usuario.nombre,
            apellido: usuario.apellido,
            rol: usuario.rol,
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

    async function manejarEnvio(e) {
        e.preventDefault()
        setError('')
        setMensaje('')

        if (!validar()) return

        try {
            await actualizarUsuario(sesion.token, editandoId, {
                nombre: formulario.nombre.trim(),
                apellido: formulario.apellido.trim(),
                rol: formulario.rol,
            })
            setMensaje('Usuario actualizado correctamente')
            cancelarEdicion()
            await cargar()
        } catch (err) {
            setError(err.message)
        }
    }

    async function manejarEliminar(usuario) {
        if (!window.confirm(`¿Eliminar a ${usuario.nombre} ${usuario.apellido}?`)) return

        setError('')
        setMensaje('')

        try {
            await eliminarUsuario(sesion.token, usuario.id)
            setMensaje('Usuario eliminado correctamente')
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
                    <h1>Gestión de usuarios</h1>
                </div>

                {editandoId && (
                    <div className="box" style={{marginBottom: 24}}>
                        <h2 className="titulo-form">Editar usuario</h2>

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
                                <label>Apellido</label>
                                <input
                                    type="text"
                                    name="apellido"
                                    value={formulario.apellido}
                                    onChange={manejarCambio}
                                />
                                {errores.apellido && <span className="error-campo">{errores.apellido}</span>}
                            </div>

                            <div className="campo">
                                <label>Rol</label>
                                <select name="rol" value={formulario.rol} onChange={manejarCambio}>
                                    <option value="PACIENTE">PACIENTE</option>
                                    <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                                </select>
                            </div>

                            <div className="acciones campo-ancho">
                                <button className="btn" type="submit">Guardar cambios</button>
                                <button className="btn btn-secundario" type="button" onClick={cancelarEdicion}>
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {mensaje && <p className="exito">{mensaje}</p>}
                {error && <p className="error">{error}</p>}

                <div className="box tabla-scroll" style={{marginTop: 16}}>
                    <table>
                        <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Apellido</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {usuarios.map((u) => (
                            <tr key={u.id}>
                                <td>{u.nombre}</td>
                                <td>{u.apellido}</td>
                                <td>{u.correo}</td>
                                <td>
                                    <span className={u.rol === 'ADMINISTRADOR' ? 'estado pendiente' : 'estado activo'}>
                                        {u.rol}
                                    </span>
                                </td>
                                <td className="celda-acciones">
                                    <button className="btn btn-chico" onClick={() => empezarEdicion(u)}>
                                        Editar
                                    </button>
                                    {u.correo !== sesion.correo && (
                                        <button className="btn btn-chico btn-secundario"
                                                onClick={() => manejarEliminar(u)}>
                                            Eliminar
                                        </button>
                                    )}
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

export default AdminUsuarios