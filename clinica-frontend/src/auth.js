export function guardarSesion(data, correo) {
    localStorage.setItem("token", data.token)
    localStorage.setItem("nombre", data.nombre)
    localStorage.setItem("apellido", data.apellido)
    localStorage.setItem("rol", data.rol)
    localStorage.setItem("correo", correo)
}

export function obtenerSesion() {
    const token = localStorage.getItem("token")
    if (!token) return null

    return {
        token,
        nombre: localStorage.getItem("nombre"),
        apellido: localStorage.getItem("apellido"),
        rol: localStorage.getItem("rol"),
        correo: localStorage.getItem("correo"),
    }
}

export function cerrarSesion() {
    localStorage.clear()
}

export function tokenVencido(token) {
    try {
        const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
        return payload.exp * 1000 < Date.now()
    } catch {
        return true
    }
}