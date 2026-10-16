import {useEffect, useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import {login} from '../api'
import {guardarSesion} from '../auth'
import '../css/login.css'

function Login() {
    const [correo, setCorreo] = useState('')
    const [password, setPassword] = useState('')
    const [errores, setErrores] = useState({})
    const [error, setError] = useState(() =>
        sessionStorage.getItem('sesionVencida') ? 'Tu sesión expiró. Inicia sesión nuevamente' : ''
    )
    const navigate = useNavigate()

    useEffect(() => {
        sessionStorage.removeItem('sesionVencida')
    }, [])

    function validar() {
        const nuevos = {}

        if (!correo.trim()) {
            nuevos.correo = 'El correo es obligatorio'
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            nuevos.correo = 'Ingresa un correo válido'
        }

        if (!password) {
            nuevos.password = 'La contraseña es obligatoria'
        }

        setErrores(nuevos)
        return Object.keys(nuevos).length === 0
    }

    async function manejarLogin(e) {
        e.preventDefault()
        setError('')

        if (!validar()) return

        try {
            const data = await login(correo.trim(), password)
            guardarSesion(data, correo.trim())

            if (data.rol === 'ADMINISTRADOR') {
                navigate('/admin')
            } else {
                navigate('/paciente')
            }
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="login">
            <div className="side">
                <div className="icon">+</div>
                <div className="logo">Clínica InnovaSalud</div>
                <p>Tu salud, en buenas manos. Reserva y gestiona tus citas desde un solo lugar.</p>
            </div>

            <div className="main">
                <div className="card box">
                    <h1 className="title">Iniciar sesión</h1>
                    <p className="sub">Ingresa con tu correo y contraseña</p>

                    <form className="form" onSubmit={manejarLogin} noValidate>
                        <label>Correo</label>
                        <input
                            type="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                        />
                        {errores.correo && <span className="error-campo">{errores.correo}</span>}

                        <label>Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {errores.password && <span className="error-campo">{errores.password}</span>}

                        {error && <p className="error">{error}</p>}

                        <button className="btn" type="submit">Iniciar sesión</button>
                    </form>

                    <Link className="link" to="/registro">¿No tienes cuenta? Crea una aquí</Link>
                </div>
            </div>
        </div>
    )
}

export default Login