#!/bin/bash

set -e

if [[ -z "$CONTROLS_API_URL" ]]; then
  echo "You must provide CONTROLS_API_URL environment variable" 1>&2
  exit 1
fi

if [[ -z "$APPLICATION_INVENTORY_API_URL" ]]; then
  echo "You must provide APPLICATION_INVENTORY_API_URL environment variable" 1>&2
  exit 1
fi

if [[ -z "$PATHFINDER_API_URL" ]]; then
  echo "You must provide PATHFINDER_API_URL environment variable" 1>&2
  exit 1
fi

if [[ -z "$SSO_REALM" ]]; then
  echo "You must provide SSO_REALM environment variable" 1>&2
  exit 1
fi
if [[ -z "$SSO_SERVER_URL" ]]; then
  echo "You must provide SSO_SERVER_URL environment variable" 1>&2
  exit 1
fi
if [[ -z "$SSO_CLIENT_ID" ]]; then
  echo "You must provide SSO_CLIENT_ID environment variable" 1>&2
  exit 1
fi

export LISTEN_IPV6="listen       [::]:8080 default_server;"
if [ "$DISABLE_IPV6" = true ] ; then
  export LISTEN_IPV6="# ${LISTEN_IPV6}"
fi

if [ -f ./nginx.conf.template ]; then
  echo "---> Processing nginx.conf.template configuration file..."
  envsubst '${LISTEN_IPV6} ${CONTROLS_API_URL} ${SSO_SERVER_URL} ${APPLICATION_INVENTORY_API_URL} ${PATHFINDER_API_URL}' < ./nginx.conf.template > ./nginx.conf
  cp -v ./nginx.conf "${NGINX_CONF_PATH}"
  rm -f ./nginx.conf
fi

if [ -f ./keycloak.json.template ]; then
  echo "---> Processing keycloak.json.template configuration file..."
  envsubst '${SSO_REALM} ${SSO_CLIENT_ID}' < ./keycloak.json.template > ./keycloak.json
fi

echo "Container started"

exec "$@"
