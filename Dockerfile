FROM satantime/puppeteer-node:20.19.3-bullseye as build

WORKDIR /src
# setup yarn
COPY package.json yarn.lock .yarn .yarnrc.yml ./
RUN yarn set version berry
RUN yarn
# build nuxt
COPY . .
RUN yarn build

# get final assets
FROM satantime/puppeteer-node:20.19.3-bullseye
COPY --from=build /src/.output .

# Yarn
ENV YARN_ENABLE_IMMUTABLE_INSTALLS="false"
# Firebase, público
ENV F_API_KEY="AIzaSyAQdNWMlI8-Pl5CAvpDxEoMEorwR_iYsH4"
ENV F_AUTH_DOMAIN="cuna.com.co"
ENV F_PROJECT_ID="cuna-2980b9"
ENV F_STORAGE_BUCKET="cuna-2980b9.appspot.com"
ENV F_MESSAGING_SENDER_ID="516433389242"
ENV F_APP_ID="1:516433389242:web:eda757ac314d6dcf9ec483"
ENV F_MEASUREMENT_ID="G-X7H48BMMRK"
# Cuenta de servicio, privado
ENV F_PRIVATE_KEY=$F_PRIVATE_KEY
ENV F_CLIENT_EMAIL=$F_CLIENT_EMAIL
# App check, clave del sitio, público
ENV RECAPTCHA_ENTERPRISE_SITE_KEY="6Lf24mwqAAAAAI0jHdUu8AcmYcyqjkCwRhquwtDr"

# CSRF protection (32 bytes)
# By default csurf uses `crypto.randomBytes(22).toString("base64")`
ENV CSURF_SECRET=$CSURF_SECRET

# Puppeteer
ENV PUPPETEER_CACHE_DIR=".output/puppeteer"

# Proyecto
ENV NODE_ENV="production"
# Permitir que los motores de búsqueda indexen el sitio
ENV INDEXABLE=false
# ROOT instance ID
ENV ROOT_INSTANCE="live"
# Forzar instancia
ENV INSTANCE="live"
# App name, this will override the site name on the head
ENV APP_NAME="Cuna"

EXPOSE 3000
CMD [ "node", "./server/index.mjs" ]