# Cuna

## Prerequisites

A firebase service account would be required. You could find a sample on the discord server

See [Enviroment variables](#enviroment-variables)

## Setup

Make sure to install the dependencies:

```bash
yarn install
```

## Development Server

Start the development server on http://localhost:3000

```bash
yarn dev
```

## Production

Build the application for production:

```bash
yarn build
```

## Extras

Firebase requires 2 keys, the private one from recaptcha, and the site key from recaptcha enterprise. The former one is passed from the config file.

The debug token allows bypassing the validation on dev environments

To use the HTTPS dev server refer to: https://stackoverflow.com/a/57895543

### Enviroment variables

```
# Firebase, public
F_API_KEY="AIzaSyAQdNWMlI8-Pl5CAvpDxEoMEorwR_iYsH4"
F_AUTH_DOMAIN="cuna-2980b9.firebaseapp.com"
F_PROJECT_ID="cuna-2980b9"
F_STORAGE_BUCKET="cuna-2980b9.appspot.com"
F_MESSAGING_SENDER_ID="516433389242"
F_APP_ID="1:516433389242:web:eda757ac314d6dcf9ec483"
F_MEASUREMENT_ID="G-X7H48BMMRK"
# Service account, private
F_PRIVATE_KEY=""
F_CLIENT_EMAIL=""
# App check, site key, public
RECAPTCHA_ENTERPRISE_SITE_KEY=""

# Project
INSTANCE="localhost"
COUNTRIES_API="https://cuna-2980b9.web.app/_countries"
# Allow search engines to index the site
INDEXABLE=false

# Debugging
DEBUG_APP_CHECK=false
DEBUG_FIREBASE=false
# Compile css on runtime
DEBUG_CSS=false
# enable nuxt devtools
DEBUG_NUXT=false
# prefer https dev server
DEBUG_HTTPS=false
```

### Terraform

terraform.tfvars

```
PROJECT_NAME = ""
PROJECT_ID = ""
PROJECT_BILLING_ACCOUNT = ""
```
