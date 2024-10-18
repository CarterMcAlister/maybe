# ------------------------------------------
#                BUILD STAGE
# ------------------------------------------
FROM node:16-alpine AS builder

WORKDIR /app
COPY ./dist/apps/server ./prisma ./
RUN npm install -g pnpm@8
RUN ls
# nrwl/nx#20079, generated lockfile is completely broken
RUN rm -f pnpm-lock.yaml
RUN pnpm install --prod --no-frozen-lockfile && pnpm add ejs

# ------------------------------------------
#                PROD STAGE
# ------------------------------------------
FROM node:16-alpine AS prod

# Used for container health checks
RUN apk add --no-cache curl
WORKDIR /app
USER node
COPY --from=builder /app  .

CMD ["node", "--es-module-specifier-resolution=node", "./main.js"]
