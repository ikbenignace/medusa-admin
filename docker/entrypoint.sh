# SET DEFAULT ENV IF NOT SET
export GATSBY_MEDUSA_BACKEND_URL="${GATSBY_MEDUSA_BACKEND_URL:=unknown}";
# CHECK IF FILES IS NOT CREATED, ELSE CREATE
cd /usr/share/nginx/html;if [ ! -f .env ];
then
    echo "GATSBY_MEDUSA_BACKEND_URL=$GATSBY_MEDUSA_BACKEND_URL" > .env
fi;# BUILD PROJECT
yarn build;# KEEP NGINX DAEMON RUNNING
nginx -g 'daemon off;'; nginx -s reload;