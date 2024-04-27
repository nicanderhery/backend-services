#!/bin/sh
# Version: 1.0.1

#! If the script can not be launched, run the following command first:
# chmod +x deploy.sh

# Example config for nginx.conf for frontend
# config="location /$DIR_NAME {
#     root $FILE_DIR;
#     index index.html;
#     try_files \$uri \$uri/ =404;
# }"

# Example config for nginx.conf for backend
# config="location /api {
#     proxy_set_header    Host             \$host;
#     proxy_set_header    X-Real-IP        \$remote_addr;
#     proxy_set_header    X-Forwarded-For  \$proxy_add_x_forwarded_for;
#     proxy_set_header    X-Forwarded-Proto https;
#     proxy_pass http://localhost:9999/api;
# }"

remove_config_and_dist() {
    echo "Removing the nginx config and the distribution."
    sudo rm -rf $FILE_CONFIG
    sudo rm -rf $FILE_DIR
    echo "The nginx config and the distribution have been removed."
}

# Shows the user how to use the script if no parameters are entered
if [ -z "$1" ]; then
    echo "You have not entered any parameters. The parameters are optional."
    echo "Usage: ./deploy.sh [OPTIONS]"
    echo "Example: ./deploy.sh -d example.com"
    echo "Example: ./deploy.sh -d example.com -p 8080"
    echo "Example: ./deploy.sh -d example.com -p 8080 -sr /portofolio"
    echo "Example: ./deploy.sh -d example.com -p 8080 -sr /portofolio -br dist"
    echo "Example: ./deploy.sh -d example.com -p 8080 -sr /portofolio -br dist -fr frontend/dist"
    echo "Options:"
    echo "-d, --domain    The domain name of the website. Default is localhost."
    echo "-p, --port      The port number of the backend."
    echo "-sr, --sub-route The sub-route where to put the static frontend files. Default is /."
    echo "-br, --backend The backend directory. Default is dist."
    echo "-fr, --frontend The frontend directory. Default is dist."
    exit 1
fi

# Read parameters --domain and --port
while [ "$#" -gt 0 ]; do
    case "$1" in
    -d | --domain)
        DOMAIN="$2"
        shift 2
        ;;
    -p | --port)
        PORT="$2"
        shift 2
        ;;
    -sr | --sub-route)
        SUB_ROUTE="$2"
        shift 2
        ;;
    -br | --backend)
        BACKEND="$2"
        shift 2
        ;;
    -fr | --frontend)
        FRONTEND="$2"
        shift 2
        ;;
    *)
        echo "Unknown parameter passed: $1"
        exit 1
        ;;
    esac
done

# Throw an error if the port number is empty
if [ -z "$PORT" ]; then
    echo "The port number is empty. Please enter a port number."
    exit 1
fi

if [ -z "$DOMAIN" ]; then
    DOMAIN="localhost"
fi

if [ -z "$SUB_ROUTE" ]; then
    SUB_ROUTE="/"
fi

if [ -z "$BACKEND" ]; then
    BACKEND="dist"
fi

if [ -z "$FRONTEND" ]; then
    FRONTEND="dist"
fi

GITHUB_GIST=https://gist.github.com/nicanderhery/2c06fb6f5688a59ce29046dd5ed3a512
NGINX_HTML_ADDRESS=/var/www/html
DIR_NAME=${PWD##*/}
FILE_DIR="$NGINX_HTML_ADDRESS/$DOMAIN/$DIR_NAME"
FILE_CONFIG=/etc/nginx/domain_routes/$DOMAIN.$DIR_NAME.conf
CONFIG=""

# Check if BACKEND directory exists, then add /api to the proxy_pass
if [ -d "$BACKEND" ]; then
    CONFIG="location /api {
    proxy_set_header    Host             \$host;
    proxy_set_header    X-Real-IP        \$remote_addr;
    proxy_set_header    X-Forwarded-For  \$proxy_add_x_forwarded_for;
    proxy_set_header    X-Forwarded-Proto https;
    proxy_pass http://localhost:$PORT/api;
}"
fi

# Check if the /var/www/html/$DOMAIN directory exists
if [ ! -e "$NGINX_HTML_ADDRESS/$DOMAIN" ]; then
    echo "The /var/www/html/$DOMAIN directory does not exist. Please run the script from $GITHUB_GIST."
    exit 1
fi

# Check whether the directory's name contains a dot or a space
case "$PWD" in
*\.* | *\ *)
    echo "The directory's name contains a dot or a space. Please rename the directory and try again."
    exit 1
    ;;
esac

# Check whether nginx is installed
if [ ! -x "$(command -v nginx)" ]; then
    echo "nginx is not installed. Please install nginx first."
    exit 1
fi

# Create the directory $FILE_DIR if it does not exist
if [ ! -d "$FILE_DIR" ]; then
    sudo mkdir -p $FILE_DIR
fi

# Create the directory /etc/nginx/domain_routes if it does not exist
if [ ! -d "/etc/nginx/domain_routes" ]; then
    sudo mkdir -p /etc/nginx/domain_routes
fi

# Copy the distribution to the directory if it contains index.html
if [ -d "$FRONTEND" ] && [ -f "$FRONTEND/index.html" ]; then
    sudo cp -r $FRONTEND/* $FILE_DIR

    # Add the frontend to the config
    CONFIG="$CONFIG location $SUB_ROUTE {
    root $FILE_DIR;
    index index.html;
    try_files \$uri \$uri/ =404;
}"
fi

# Copy nginx config to /etc/nginx/domain_routes
echo "$CONFIG" | sudo tee $FILE_CONFIG >/dev/null

# Check whether syntax of nginx config is correct
if [ ! -x "$(command -v nginx -t)" ]; then
    echo "nginx -t is not available. Please check the nginx config."
    remove_config_and_dist
fi

# Check whether syntax of nginx config is correct
output=$(sudo nginx -t 2>&1)
case "$output" in
*"test is successful"*)
    echo "nginx config for $DIR_NAME is valid."
    ;;
*)
    echo "$output"
    echo "nginx config for $DIR_NAME is invalid. Please check the nginx config."
    remove_config_and_dist
    exit 1
    ;;
esac

# Reload nginx
sudo nginx -s reload
echo "nginx has been reloaded."
