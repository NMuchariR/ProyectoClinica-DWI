# Configuración del backend

## Configuración requerida

El backend obtiene sus credenciales y configuración sensible del entorno, no de archivos versionados:

| Variable | Uso |
|---|---|
| `DB_URL` | URL JDBC; por defecto apunta a MySQL local y a la base `avance1_clinicacitas`. |
| `DB_USERNAME` / `DB_PASSWORD` | Cuenta de aplicación de MySQL. No usar `root`; limitar permisos a esta base. |
| `JWT_SECRET` | Clave aleatoria codificada en Base64, con al menos 32 bytes antes de codificar. Mantenerla estable y secreta; al rotarla se invalidan los JWT existentes. |
| `CORS_ALLOWED_ORIGINS` | Orígenes frontend permitidos, separados por comas. Por defecto: `http://localhost:5173`. |
| `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`, `BOOTSTRAP_ADMIN_FIRST_NAME`, `BOOTSTRAP_ADMIN_LAST_NAME` | Datos para crear el administrador inicial si aún no existe. Se requieren juntos; la contraseña debe tener entre 12 y 72 bytes UTF-8. |
| `JPA_DDL_AUTO` | Estrategia Hibernate; por defecto `update` para desarrollo local. |

Guarda los valores en el gestor de secretos del entorno. No añadas valores reales a `application.properties`, al frontend ni al control de versiones. Proporciona las cuatro variables `BOOTSTRAP_ADMIN_*` solo durante el primer arranque y retíralas después de verificar la cuenta. El inicializador no cambia la contraseña de una cuenta existente.

Las credenciales de base de datos y la clave JWT anteriores estuvieron en archivos versionados. Rota la contraseña de MySQL y genera una clave JWT nueva antes de desplegar; la rotación JWT invalida los tokens actuales. Eliminar los valores del archivo actual no los elimina del historial de Git.

En producción, crea una cuenta MySQL propia para la aplicación, restringida al host de la aplicación y a la base de datos clínica. Concede únicamente los permisos de datos necesarios; ejecuta cambios de esquema mediante migraciones administradas y configura `JPA_DDL_AUTO=validate` para que la aplicación no modifique el esquema.

## Transporte y frontend

En producción, sirve el frontend y el backend por HTTPS (por ejemplo, detrás de un proxy que fuerce TLS), configura `CORS_ALLOWED_ORIGINS` solo con el origen HTTPS real y construye el frontend con `VITE_API_URL` apuntando a la URL HTTPS de la API. La URL `http://localhost:8080` es solo el fallback de desarrollo.

El JWT permanece en `localStorage` en esta versión; una vulnerabilidad XSS podría exponerlo. Evita renderizar contenido HTML no confiable y mantén las dependencias del frontend actualizadas.

## Consultas y prevención de inyección SQL

El backend utiliza métodos derivados de `UsuarioRepository` como `findByCorreo` y `existsByCorreo`; Spring Data JPA enlaza sus argumentos, en lugar de concatenarlos dentro del SQL. No construyas consultas concatenando datos recibidos del usuario. Si se incorpora SQL/JPQL explícito, utiliza parámetros enlazados y restringe dinámicamente cualquier identificador (como nombre de columna u orden) a una lista permitida: los parámetros no sustituyen identificadores SQL.

Las peticiones de registro e inicio de sesión también se validan en el servidor. La validación del frontend mejora la experiencia, pero no reemplaza la validación de backend.

## Pruebas

Desde `clinica-backend`, ejecuta `.\mvnw.cmd test` en Windows. Las pruebas usan H2 y no necesitan credenciales de MySQL ni secretos reales.
