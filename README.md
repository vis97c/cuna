# Cuna

Visor de cursos UNAL.

Cuna implementa [Sia scrapper](https://github.com/pablomancera/sia_scrapper) para obtener datos del antiguo SIA.

## Prerequisitos

Este proyecto usa [Nuxt3](https://nuxt.com/) y [firebase](https://firebase.google.com/).

- Se requiere una cuenta de servicio de Firebase.
- Firebase requiere la clave del sitio de reCAPTCHA Enterprise.
- El token de depuración permite omitir la [validación](https://firebase.google.com/docs/app-check) en entornos de desarrollo.

Para usar el servidor de desarrollo HTTPS, consulta: https://stackoverflow.com/a/57895543

Es necesario autorizar manualmente el [IAM para App Hosting](https://stackoverflow.com/questions/79473624/firebase-app-hosting-unable-to-retrieve-secrets-from-cloud-secret-manager)

```bash
# Reemplaza secretName, backendName y userEmail
firebase apphosting:secrets:grantaccess secretName --backend backendName
# También para emulación
firebase apphosting:secrets:grantaccess secretName --emails userEmail
```

**Opcional**: Si lo deseas, haz uso de [Terraform](https://www.terraform.io/) para configurar tu propia instancia de firebase. Ver [configuracion](#terraform).

### Emulación y desarrollo

El emulador usara el archivo `apphosting.emulator.yaml` para su configuración.
Al cambiar entre instancias es importante limpiar la cache de nuxt y borrar todas las cookies relacionadas en el navegador.

```bash
# Instala
yarn

# Inicia el servidor de desarrollo en http://localhost:3000
yarn dev

# Despues de una build exitosa, puedes iniciar el emulador
firebase emulators:start

# Limpia la cache de nuxt
nuxt cleanup

# Compila la aplicación para producción
yarn build
```

### Variables de entorno

Configuración requerida por este proyecto.

```dosini
# Firebase, público
F_API_KEY="AIzaSyAQdNWMlI8-Pl5CAvpDxEoMEorwR_iYsH4"
F_AUTH_DOMAIN="cuna-2980b9.firebaseapp.com"
F_PROJECT_ID="cuna-2980b9"
F_STORAGE_BUCKET="cuna-2980b9.appspot.com"
F_MESSAGING_SENDER_ID="516433389242"
F_APP_ID="1:516433389242:web:eda757ac314d6dcf9ec483"
F_MEASUREMENT_ID="G-X7H48BMMRK"
# Cuenta de servicio, privado
F_PRIVATE_KEY=""
F_CLIENT_EMAIL=""
# App check, clave del sitio, público
RECAPTCHA_ENTERPRISE_SITE_KEY="6Lf24mwqAAAAAI0jHdUu8AcmYcyqjkCwRhquwtDr"
# Cloud functions url
CF_SCRAPE_COURSES_URL=
CF_SCRAPE_COURSE_GROUPS_URL=

# CSRF protection (32 bytes)
# By default csurf uses `crypto.randomBytes(22).toString("base64")`
CSURF_SECRET=

# Proyecto
ORIGIN=
COUNTRIES_API=
# Permitir que los motores de búsqueda indexen el sitio
INDEXABLE=false
# ROOT instance ID
ROOT_INSTANCE="localhost"
# Forzar instancia
INSTANCE="localhost"
# App name, this will override the site name on the head
APP_NAME="Cuna"

# Depuración
DEBUG_APP_CHECK=false
DEBUG_FIREBASE=false
# Compilar CSS en tiempo de ejecución
DEBUG_CSS=false
# Habilitar herramientas de desarrollo de Nuxt
DEBUG_NUXT=false
# Desabilitar cache del servidor
DEBUG_NITRO=false

# Preferir servidor de desarrollo HTTPS
DEBUG_HTTPS=false
# Depuración de scrapper del SIA
DEBUG_SCRAPPER=false
```

### Terraform

Configuración requerida por terraform.

terraform.tfvars

```dosini
PROJECT_NAME = ""
PROJECT_ID = ""
PROJECT_BILLING_ACCOUNT = ""
```

## Contribuir a Cuna

Para contribuir configura el proyecto localmente y aplica tus cambios. Abre un PR cuando quieras vincularlos a este proyecto.
