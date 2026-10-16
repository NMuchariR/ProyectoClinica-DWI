import {useEffect, useState} from 'react'
import {Link, NavLink, useNavigate} from 'react-router-dom'
import {cerrarSesion} from '../auth'

function Nav({nombre, rol}) {
    const navigate = useNavigate()
    const [menuAbierto, setMenuAbierto] = useState(false)

    useEffect(() => {
        if (!menuAbierto) return undefined
        function manejarTecla(evento) {
            if (evento.key === 'Escape') setMenuAbierto(false)
        }
        window.addEventListener('keydown', manejarTecla)
        return () => window.removeEventListener('keydown', manejarTecla)
    }, [menuAbierto])

    useEffect(() => {
        document.body.style.overflow = menuAbierto ? 'hidden' : ''
        return () => {
            document.body.style.overflow = ''
        }
    }, [menuAbierto])

    function salir() {
        cerrarSesion()
        navigate('/login')
    }

    const enlaces = rol === 'ADMINISTRADOR'
        ? [
            {ruta: '/admin', texto: 'Panel', exacto: true},
            {ruta: '/admin/reservas', texto: 'Agenda de citas', exacto: false},
            {ruta: '/admin/servicios', texto: 'Servicios', exacto: false},
            {ruta: '/admin/usuarios', texto: 'Usuarios', exacto: false},
        ]
        : [
            {ruta: '/paciente', texto: 'Inicio', exacto: true},
            {ruta: '/paciente/reservas', texto: 'Mis reservas', exacto: false},
            {ruta: '/paciente/calendario', texto: 'Calendario', exacto: false},
        ]

    const rutaInicio = rol === 'ADMINISTRADOR' ? '/admin' : '/paciente'

    return (
        <>
            <button
                className="menu-toggle"
                type="button"
                aria-label={menuAbierto ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
                aria-expanded={menuAbierto}
                aria-controls="menu-lateral"
                onClick={() => setMenuAbierto((abierto) => !abierto)}
            >
                <span aria-hidden="true">{menuAbierto ? '×' : '☰'}</span>
            </button>

            {menuAbierto && (
                <button
                    className="menu-overlay"
                    type="button"
                    aria-label="Cerrar menú de navegación"
                    onClick={() => setMenuAbierto(false)}
                />
            )}

            <aside
                className={`side ${menuAbierto ? 'side-abierto' : ''}`}
                id="menu-lateral"
                aria-label="Navegación principal"
            >
                <Link className="logo" to={rutaInicio} onClick={() => setMenuAbierto(false)}>
                    Clínica InnovaSalud
                </Link>

                <nav className="menu-nav">
                    {enlaces.map((e) => (
                        <NavLink
                            key={e.ruta}
                            to={e.ruta}
                            end={e.exacto}
                            className={({isActive}) => isActive ? 'menu-enlace activo' : 'menu-enlace'}
                            onClick={() => setMenuAbierto(false)}
                        >
                            {e.texto}
                        </NavLink>
                    ))}
                </nav>

                <div className="user">
                    <div className="name">{nombre}</div>
                    <div className="role">{rol}</div>
                </div>

                <button className="btn" onClick={salir}>Cerrar sesión</button>
            </aside>
        </>
    )
}

export default Nav