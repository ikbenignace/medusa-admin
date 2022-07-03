# BASE IMAGE
FROM node:14-alpine 
# ADDITIONAL LIBRARIES NEEDED FOR BUILD
RUN apk update; \
    apk add libpng-dev; \
    apk add autoconf; \
    apk add automake; \
    apk add make; \
    apk add g++; \
    apk add libtool; \
    apk add nasm; \
    apk add nginx; \
    mkdir /run/nginx/; \
    mkdir /usr/share/nginx; \
    mkdir /usr/share/nginx/html;
WORKDIR /usr/share/nginx/html
COPY . /usr/share/nginx/html
# OUR CONFIGURATION FILES FOR ENVIRONMENT VARIABLES
COPY $PWD/docker/entrypoint.sh /usr/local/bin
RUN chmod +x /usr/local/bin/entrypoint.sh
ENTRYPOINT ["/bin/sh", "/usr/local/bin/entrypoint.sh"]
RUN yarn install --non-interactive --frozen-lockfile
CMD ["/bin/sh", "-c", "exec nginx -g 'daemon off;';"]