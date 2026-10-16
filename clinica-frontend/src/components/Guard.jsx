import {Navigate} from 'react-router-dom'
import {cerrarSesion, obtenerSesion, tokenVencido} from '../auth'

function Guard({rolPermitido, children}) {
    const sesion = obtenerSesion()

    if (!sesion) {
        return <Navigate to="/login" replace/>
    }

    if (tokenVencido(sesion.token)) {
        cerrarSesion()
        sessionStorage.setItem('sesionVencida', '1')
        return <Navigate to="/login" replace/>
    }

    if (sesion.rol !== rolPermitido) {
        return <Navigate to="/login" replace/>
    }

    return children
}

export default Guard