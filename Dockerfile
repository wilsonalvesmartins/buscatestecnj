# Estágio 1: Instala dependências e compila o React
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio 2: Sobe o Nginx com o Proxy
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# A porta que vamos expor para o Coolify (corrigido)
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
