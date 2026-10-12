# Revisión de seguridad

**Fecha:** 2026-10-12  
**Alcance:** revisión estática del backend y del uso de autenticación del frontend en el proyecto de clínica.

## Hallazgos

| # | Severidad | Archivo y líneas | Hallazgo | Confianza |
|---|---|---|---|---:|
| 1 | Alta | `clinica-backend/src/main/java/com/avance1DWI/clinica_backend/config/DataInitializer.java:23-31` | Se aprovisiona una cuenta administradora con credenciales fijas incluidas en el código. Si continúan activas en un entorno publicado, un atacante podría autenticarse como administrador y acceder a rutas administrativas. | 9/10 |
| 2 | Alta | `clinica-backend/src/main/java/com/avance1DWI/clinica_backend/security/JwtUtil.java:13-15` | La clave de firma JWT está codificada en el repositorio. Alguien con acceso a ella puede falsificar tokens y asignarles roles privilegiados para acceder a rutas administrativas. | 9/10 |

## Acciones prioritarias

1. Retirar las credenciales de administrador del código. Crear la cuenta mediante un aprovisionamiento seguro y temporal, y desactivar ese mecanismo en producción.
2. Generar una clave JWT aleatoria y de alta entropía, suministrarla desde un gestor de secretos o una variable de entorno protegida, rotar la clave expuesta e invalidar los tokens firmados con ella.

## Buenas prácticas recomendadas

- Ejecutar la aplicación con una cuenta de base de datos distinta de `root` y con los permisos mínimos necesarios. Mantener las credenciales fuera de archivos versionados.
- Usar HTTPS en todos los entornos accesibles por red y separar la configuración de desarrollo y producción.
- Validar las contraseñas en el backend, no solo en el formulario del navegador. Mantener el hash BCrypt y calibrar su coste para el entorno.
- Restringir CORS a los orígenes de producción requeridos.
- Desactivar `spring.jpa.show-sql` en producción y evitar registrar secretos o datos personales.
- Revisar el almacenamiento del JWT en `localStorage`: una vulnerabilidad XSS podría permitir robarlo. Si se migra a cookies `HttpOnly`, `Secure` y `SameSite`, considerar también las protecciones CSRF correspondientes.
- Añadir pruebas de autorización que verifiquen que un paciente no puede acceder a rutas administrativas y pruebas que comprueben que las contraseñas no aparecen en respuestas ni registros.
