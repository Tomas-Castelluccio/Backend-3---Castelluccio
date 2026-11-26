FROM node:24-trixie-slim AS dependencies

WORKDIR /app

# bcrypt es nativo; estas herramientas solo se incluyen en la etapa de instalación.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

FROM node:24-trixie-slim AS runtime

ENV NODE_ENV=development \
    PORT=8080 \
    MONGO_URI=mongodb://host.docker.internal:27017/ecommerce \
    FRONTEND_URL=http://localhost:8080

WORKDIR /app

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package*.json ./
# Incluye el código fuente, vistas, documentación, tests y datos del proyecto.
COPY --chown=node:node . .
RUN apt-get update \
  && apt-get upgrade -y --no-install-recommends \
  && rm -rf /var/lib/apt/lists/* \
  && rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx \
  && mkdir -p /app/data \
  && chown node:node /app/data

USER node

EXPOSE 8080
CMD ["node", "index.js"]
