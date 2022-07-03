# SET DEFAULT ENV IF NOT SET
export GATSBY_STORE_URL="${GATSBY_STORE_URL:=unknown}";# CHECK IF FILES IS NOT CREATED, ELSE CREATE
cd /usr/share/nginx/html;if [ ! -f .env ];
then
    echo "GATSBY_STORE_URL=$GATSBY_STORE_URL" > .env
fi;# BUILD PROJECT
yarn build;# KEEP NGINX DAEMON RUNNING
nginx -g 'daemon off;'; nginx -s reload;