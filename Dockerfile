# ── 阶段1: 构建前端 ──
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── 阶段2: Nginx 部署 ──
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

# Nginx 配置：SPA 路由 + API 反向代理
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    index index.html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api/ { \
        proxy_pass http://backend:8000; \
        proxy_http_version 1.1; \
        proxy_set_header Connection ""; \
        proxy_set_header X-Accel-Buffering no; \
        proxy_buffering off; \
        proxy_cache off; \
        proxy_read_timeout 300s; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
