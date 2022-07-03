FROM node:14 as builder

WORKDIR /app/admin

COPY . .

RUN yarn install && yarn build

FROM nginx:alpine

COPY --from=builder /app/admin/public /usr/share/nginx/html

COPY $PWD/docker/entrypoint.sh /usr/local/bin

RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/bin/sh", "/usr/local/bin/entrypoint.sh"]

CMD ["/bin/sh", "-c", "exec nginx -g 'daemon off;';"]

#ENTRYPOINT ["nginx", "-g", "daemon off;"]