const API = import.meta.env.VITE_API_URL?.trim().replace(/\/+$/, "")
    || (import.meta.env.DEV ? "http://localhost:8080" : null)

if (!API) {
    throw new Error("VITE_API_URL debe configurarse fuera del entorno de desarrollo")
}

if (import.meta.env.PROD && !API.startsWith("https://")) {
    throw new Error("VITE_API_URL debe usar HTTPS en producción")
}

export async function login(correo, password) {
    const res = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({correo, password}),
    })

    if (!res.ok) {
        const mensaje = await res.text()
        throw new Error(mensaje || "Correo o contraseña incorrectos")
    }

    return res.json()
}

export async function registrar(datos) {
    const res = await fetch(`${API}/api/auth/registro`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify(datos),
    })

    if (!res.ok) {
        const mensaje = await res.text()
        throw new Error(mensaje || "No se pudo completar el registro")
    }

    return res.json()
}

export async function obtenerUsuarios(token) {
    const res = await fetch(`${API}/api/admin/usuarios`, {
        headers: {Authorization: `Bearer ${token}`},
    })

    if (!res.ok) {
        throw new Error("No se pudo obtener la lista de usuarios")
    }

    return res.json()
}