import {useState} from 'react'
import {useNavigate, Link} from 'react-router-dom'
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
    const [error, setError] = useState('')
    const [exito, setExito] = useState('')
    const navigate = useNavigate()

    function cambiar(campo, valor) {
        setForm({...form, [campo]: valor})
    }

    function validar() {
        if (!form.nombre || !form.apellido || !form.correo || !form.password || !form.confirmar) {
            return 'Todos los campos son obligatorios'
        }

        const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)
        if (!correoValido) {
            return 'Ingresa un correo válido'
        }

        if (form.password.length < 12) {
            return 'La contraseña debe tener al menos 12 caracteres'
        }

        if (form.password !== form.confirmar) {
            return 'Las contraseñas no coinciden'
        }

        return ''
    }

    async function manejarRegistro(e) {
        e.preventDefault()
        setError('')
        setExito('')

        const errorValidacion = validar()
        if (errorValidacion) {
            setError(errorValidacion)
            return
        }

        try {
            await registrar({
                nombre: form.nombre,
                apellido: form.apellido,
                correo: form.correo,
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

                    <form className="form" onSubmit={manejarRegistro}>
                        <label>Nombre</label>
                        <input maxLength={100} value={form.nombre} onChange={(e) => cambiar('nombre', e.target.value)}/>

                        <label>Apellido</label>
                        <input maxLength={100} value={form.apellido} onChange={(e) => cambiar('apellido', e.target.value)}/>

                        <label>Correo</label>
                        <input type="email" maxLength={254} value={form.correo} onChange={(e) => cambiar('correo', e.target.value)}/>

                        <label>Contraseña</label>
                        <input type="password" minLength={12} maxLength={72} value={form.password}
                               onChange={(e) => cambiar('password', e.target.value)}/>

                        <label>Confirmar contraseña</label>
                        <input type="password" minLength={12} maxLength={72} value={form.confirmar}
                               onChange={(e) => cambiar('confirmar', e.target.value)}/>

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