FROM node:14 as builder

WORKDIR /app/admin

COPY . .

RUN yarn install && yarn build

FROM nginx:alpine

COPY --from=builder /app/admin/public /usr/share/nginx/html

ENTRYPOINT ["nginx", "-g", "daemon off;"]