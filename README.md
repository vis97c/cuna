# Cuna

Visor de cursos UNAL.

Cuna implementa [Sia scrapper](https://github.com/pablomancera/sia_scrapper) para obtener datos del antiguo SIA.

## Prerequisitos

Este proyecto usa [Nuxt3](https://nuxt.com/) y [firebase](https://firebase.google.com/).

- Se requiere una cuenta de servicio de Firebase.
- Firebase requiere la clave del sitio de reCAPTCHA Enterprise.
- El token de depuración permite omitir la [validación](https://firebase.google.com/docs/app-check) en entornos de desarrollo.

Para usar el servidor de desarrollo HTTPS, consulta: https://stackoverflow.com/a/57895543

**Opcional**: Si lo deseas, haz uso de [Terraform](https://www.terraform.io/) para configurar tu propia instancia de firebase. Ver [configuracion](#terraform).

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
RECAPTCHA_ENTERPRISE_SITE_KEY=""

# Proyecto
INSTANCE="localhost"
COUNTRIES_API="https://cuna.com.co/_countries"
# Permitir que los motores de búsqueda indexen el sitio
INDEXABLE=false

# Depuración
DEBUG_APP_CHECK=false
DEBUG_FIREBASE=false
# Compilar CSS en tiempo de ejecución
DEBUG_CSS=false
# Habilitar herramientas de desarrollo de Nuxt
DEBUG_NUXT=false
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

## Configuración

Asegúrate de instalar las dependencias:

```bash
yarn install
```

### Servidor de Desarrollo

Inicia el servidor de desarrollo en http://localhost:3000

```bash
yarn dev
```

### Producción

Construye la aplicación para producción:

```bash
yarn build
```

## Contribuir a Cuna

Para contribuir configura el proyecto localmente y aplica tus cambios. Abre un PR cuando quieras vincularlos a este proyecto.
