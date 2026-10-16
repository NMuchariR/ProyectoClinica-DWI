import {useEffect, useState} from 'react'

const PREFERENCIAS_INICIALES = {
    modoNoche: false,
    altoContraste: false,
}

function leerPreferencias() {
    try {
        const guardadas = JSON.parse(localStorage.getItem('preferenciasVisuales') || '{}')
        const altoContraste = guardadas.altoContraste === true
        return {
            modoNoche: !altoContraste && guardadas.modoNoche === true,
            altoContraste,
        }
    } catch {
        return PREFERENCIAS_INICIALES
    }
}

function PreferenciasVisuales() {
    const [abierto, setAbierto] = useState(false)
    const [preferencias, setPreferencias] = useState(leerPreferencias)

    useEffect(() => {
        const raiz = document.documentElement
        raiz.dataset.modoNoche = String(preferencias.modoNoche)
        raiz.dataset.altoContraste = String(preferencias.altoContraste)
        localStorage.setItem('preferenciasVisuales', JSON.stringify(preferencias))
    }, [preferencias])

    useEffect(() => {
        if (!abierto) return undefined

        function cerrarConEscape(evento) {
            if (evento.key === 'Escape') setAbierto(false)
        }

        window.addEventListener('keydown', cerrarConEscape)
        return () => window.removeEventListener('keydown', cerrarConEscape)
    }, [abierto])

    function cambiarPreferencia(nombre) {
        setPreferencias((actuales) => ({
            modoNoche: false,
            altoContraste: false,
            [nombre]: !actuales[nombre],
        }))
    }

    return (
        <div className="preferencias-visuales">
            {abierto && (
                <>
                    <button
                        className="preferencias-fondo"
                        type="button"
                        aria-label="Cerrar opciones de apariencia"
                        onClick={() => setAbierto(false)}
                    />
                    <section className="preferencias-panel" aria-label="Opciones de apariencia">
                        <h2>Apariencia</h2>
                        <label className="preferencias-opcion">
                            <span>Modo noche</span>
                            <input
                                type="checkbox"
                                role="switch"
                                checked={preferencias.modoNoche}
                                onChange={() => cambiarPreferencia('modoNoche')}
                            />
                        </label>
                        <label className="preferencias-opcion">
                            <span>Alto contraste</span>
                            <input
                                type="checkbox"
                                role="switch"
                                checked={preferencias.altoContraste}
                                onChange={() => cambiarPreferencia('altoContraste')}
                            />
                        </label>
                    </section>
                </>
            )}
            <button
                className="preferencias-boton"
                type="button"
                aria-label={abierto ? 'Cerrar opciones de apariencia' : 'Abrir opciones de apariencia'}
                aria-expanded={abierto}
                onClick={() => setAbierto((estado) => !estado)}
            >
                <span aria-hidden="true">{abierto ? '×' : '◐'}</span>
            </button>
        </div>
    )
}

export default PreferenciasVisuales
