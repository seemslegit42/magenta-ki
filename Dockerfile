FROM oven/bun:latest AS builder

WORKDIR /app
COPY package*.json ./
RUN bun install

COPY . .
RUN bun run build

FROM oven/bun:latest
WORKDIR /app
COPY package*.json ./
RUN bun install --production

COPY --from=builder /app/dist /app/dist

EXPOSE 3001
ENV PORT=3001
CMD ["bun", "dist/app/server/server.mjs"]
