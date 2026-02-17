# -------- Stage 1: Builder --------
FROM node:20-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build


# -------- Stage 2: Production Runtime --------
FROM node:20-slim AS production

WORKDIR /app

ENV NODE_ENV=production

RUN useradd -m appuser

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN chown -R appuser:appuser /app
USER appuser

CMD ["node", "dist/app.js"]


# -------- Stage 3: Test Runtime --------
FROM builder AS test

ENV NODE_ENV=test

CMD ["npm", "run", "test"]
