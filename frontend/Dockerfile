FROM node:18-alpine

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
COPY pnpm-lock.yaml* ./

# Instalar dependencias
RUN npm install -g pnpm && pnpm install

# Copiar código fuente
COPY . .

# Build
RUN pnpm run build

# Exponer puerto
EXPOSE 3000

# Start
CMD ["pnpm", "start"]
