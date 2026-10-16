import {cerrarSesion} from "./auth"

const API = "http://localhost:8080"

async function fetchSeguro(url, opciones) {
    const res = await fetch(url, opciones)
    if (res.status === 401 && opciones.headers.Authorization) {
        cerrarSesion()
        sessionStorage.setItem("sesionVencida", "1")
        window.location.href = "/login"
        throw new Error("Tu sesión expiró. Inicia sesión nuevamente")
    }
    return res
}

async function solicitar(ruta, opciones = {}) {
    const {
        token,
        method = "GET",
        datos,
        error = "No se pudo completar la solicitud",
        leerError = false,
        sinRespuesta = false,
    } = opciones
    const headers = {}

    if (token) headers.Authorization = `Bearer ${token}`
    if (datos !== undefined) headers["Content-Type"] = "application/json"

    const res = await fetchSeguro(`${API}${ruta}`, {
        method,
        headers,
        ...(datos !== undefined ? {body: JSON.stringify(datos)} : {}),
    })

    if (!res.ok) {
        const mensaje = leerError ? await res.text() : ""
        throw new Error(mensaje || error)
    }

    return sinRespuesta ? undefined : res.json()
}

function parametrosDisponibilidad(datos, excluirReservaId) {
    const parametros = new URLSearchParams(datos)
    if (excluirReservaId) parametros.set("excluirReservaId", excluirReservaId)
    return parametros
}

export function login(correo, password) {
    return solicitar("/api/auth/login", {
        method: "POST",
        datos: {correo, password},
        error: "Correo o contraseña incorrectos",
        leerError: true,
    })
}

export function registrar(datos) {
    return solicitar("/api/auth/registro", {
        method: "POST",
        datos,
        error: "No se pudo completar el registro",
        leerError: true,
    })
}

export function obtenerUsuarios(token) {
    return solicitar("/api/admin/usuarios", {token, error: "No se pudo obtener la lista de usuarios"})
}

export function actualizarUsuario(token, id, datos) {
    return solicitar(`/api/admin/usuarios/${id}`, {
        token, method: "PUT", datos, error: "No se pudo actualizar el usuario", leerError: true,
    })
}

export function eliminarUsuario(token, id) {
    return solicitar(`/api/admin/usuarios/${id}`, {
        token, method: "DELETE", error: "No se pudo eliminar el usuario", leerError: true, sinRespuesta: true,
    })
}

export function obtenerServicios(token) {
    return solicitar("/api/servicios", {token, error: "No se pudo obtener la lista de servicios"})
}

export function obtenerMedicos(token) {
    return solicitar("/api/medicos", {token, error: "No se pudo obtener la lista de médicos"})
}

export function obtenerMedicosDisponibles(token, fecha, hora, servicioId, sede, excluirReservaId) {
    const parametros = parametrosDisponibilidad({fecha, hora, servicioId, sede}, excluirReservaId)
    return solicitar(`/api/medicos/disponibles?${parametros}`, {
        token, error: "No se pudo consultar la disponibilidad de médicos",
    })
}

export function obtenerHorariosDisponibles(token, fecha, servicioId, sede, excluirReservaId) {
    const parametros = parametrosDisponibilidad({fecha, servicioId, sede}, excluirReservaId)
    return solicitar(`/api/medicos/horarios-disponibles?${parametros}`, {
        token, error: "No se pudo consultar los horarios disponibles",
    })
}

export function crearServicio(token, datos) {
    return solicitar("/api/admin/servicios", {
        token, method: "POST", datos, error: "No se pudo crear el servicio", leerError: true,
    })
}

export function actualizarServicio(token, id, datos) {
    return solicitar(`/api/admin/servicios/${id}`, {
        token, method: "PUT", datos, error: "No se pudo actualizar el servicio", leerError: true,
    })
}

export function eliminarServicio(token, id) {
    return solicitar(`/api/admin/servicios/${id}`, {
        token, method: "DELETE", error: "No se pudo eliminar el servicio", leerError: true, sinRespuesta: true,
    })
}

export function crearReserva(token, datos) {
    return solicitar("/api/reservas", {
        token, method: "POST", datos, error: "No se pudo crear la reserva", leerError: true,
    })
}

export function obtenerMisReservas(token) {
    return solicitar("/api/reservas/mis-reservas", {
        token, error: "No se pudo obtener tu historial de reservas",
    })
}

export function cancelarReserva(token, id) {
    return solicitar(`/api/reservas/${id}/cancelar`, {
        token, method: "PUT", error: "No se pudo cancelar la reserva", leerError: true,
    })
}

export function obtenerTodasReservas(token) {
    return solicitar("/api/admin/reservas", {token, error: "No se pudo obtener la lista de reservas"})
}

export function cancelarReservaAdmin(token, id) {
    return solicitar(`/api/admin/reservas/${id}/cancelar`, {
        token, method: "PUT", error: "No se pudo cancelar la reserva", leerError: true,
    })
}

export function crearReservaAdmin(token, pacienteId, datos) {
    const parametros = new URLSearchParams({pacienteId})
    return solicitar(`/api/admin/reservas?${parametros}`, {
        token, method: "POST", datos, error: "No se pudo agendar la cita", leerError: true,
    })
}

export function actualizarReservaAdmin(token, id, datos) {
    return solicitar(`/api/admin/reservas/${id}`, {
        token, method: "PUT", datos, error: "No se pudo modificar la cita", leerError: true,
    })
}

export function obtenerReporte(token) {
    return solicitar("/api/admin/reportes", {token, error: "No se pudo obtener el reporte"})
}
