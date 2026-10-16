import {useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {registrar} from '../api'
import '../css/register.css'

function Register() {
    const [form, setForm] = useState({
        nombre: '',
        apellido: '',
        correo: '',
        password: '',
        confirmar: '',
    })
    const [errores, setErrores] = useState({})
    const [error, setError] = useState('')
    const [exito, setExito] = useState('')
    const navigate = useNavigate()

    function cambiar(campo, valor) {
        setForm({...form, [campo]: valor})
    }

    function validar() {
        const nuevos = {}

        if (!form.nombre.trim()) {
            nuevos.nombre = 'El nombre es obligatorio'
        }

        if (!form.apellido.trim()) {
            nuevos.apellido = 'El apellido es obligatorio'
        }

        if (!form.correo.trim()) {
            nuevos.correo = 'El correo es obligatorio'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) {
            nuevos.correo = 'Ingresa un correo válido'
        }

        if (!form.password) {
            nuevos.password = 'La contraseña es obligatoria'
        } else if (form.password.length < 6) {
            nuevos.password = 'La contraseña debe tener al menos 6 caracteres'
        }

        if (!form.confirmar) {
            nuevos.confirmar = 'Confirma tu contraseña'
        } else if (form.password !== form.confirmar) {
            nuevos.confirmar = 'Las contraseñas no coinciden'
        }

        setErrores(nuevos)
        return Object.keys(nuevos).length === 0
    }

    async function manejarRegistro(e) {
        e.preventDefault()
        setError('')
        setExito('')

        if (!validar()) return

        try {
            await registrar({
                nombre: form.nombre.trim(),
                apellido: form.apellido.trim(),
                correo: form.correo.trim(),
                password: form.password,
            })

            setExito('Cuenta creada correctamente. Redirigiendo al login...')
            setTimeout(() => navigate('/login'), 1500)
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="register">
            <div className="side">
                <div className="logo">Clínica InnovaSalud</div>
                <p>Crea tu cuenta y accede a la plataforma en minutos.</p>
            </div>

            <div className="main">
                <div className="card box">
                    <h1 className="title">Crear cuenta</h1>
                    <p className="sub">Introduce tus datos para registrarte</p>

                    <form className="form" onSubmit={manejarRegistro} noValidate>
                        <label>Nombre</label>
                        <input value={form.nombre} onChange={(e) => cambiar('nombre', e.target.value)}/>
                        {errores.nombre && <span className="error-campo">{errores.nombre}</span>}

                        <label>Apellido</label>
                        <input value={form.apellido} onChange={(e) => cambiar('apellido', e.target.value)}/>
                        {errores.apellido && <span className="error-campo">{errores.apellido}</span>}

                        <label>Correo</label>
                        <input type="email" value={form.correo} onChange={(e) => cambiar('correo', e.target.value)}/>
                        {errores.correo && <span className="error-campo">{errores.correo}</span>}

                        <label>Contraseña</label>
                        <input type="password" value={form.password}
                               onChange={(e) => cambiar('password', e.target.value)}/>
                        {errores.password && <span className="error-campo">{errores.password}</span>}

                        <label>Confirmar contraseña</label>
                        <input type="password" value={form.confirmar}
                               onChange={(e) => cambiar('confirmar', e.target.value)}/>
                        {errores.confirmar && <span className="error-campo">{errores.confirmar}</span>}

                        {error && <p className="error">{error}</p>}
                        {exito && <p className="ok">{exito}</p>}

                        <button className="btn" type="submit">Crear cuenta</button>
                    </form>

                    <Link className="link" to="/login">¿Ya tienes cuenta? Inicia sesión</Link>
                </div>
            </div>
        </div>
    )
}

export default Register