# If the script can not be launched, run the following command first:
# chmod +x nginx-install.sh

# Example config for nginx.conf for frontend
# config="location /$DIR_NAME {
#     alias $file_dir;
#     index index.html;
#     try_files \$uri \$uri/ =404;
# }"

# Example config for nginx.conf for backend
# config="location /api {
#     proxy_set_header    Host             $host;
#     proxy_set_header    X-Real-IP        $remote_addr;
#     proxy_set_header    X-Forwarded-For  $proxy_add_x_forwarded_for;
#     proxy_set_header    X-Forwarded-Proto https;
#     proxy_pass http://localhost:9999/api;
# }"


function remove_config_and_dist() {
    echo "Removing the nginx config and the distribution."
    sudo rm -rf $file_config
    sudo rm -rf $file_dir
    echo "The nginx config and the distribution have been removed."
}

# Ask the user which domain he would like to use
echo "What is your domain name? If you do not have one, then just press enter."
read domain

github_gist=https://gist.github.com/nicanderhery/2c06fb6f5688a59ce29046dd5ed3a512
html_address=/var/www/html
DIR_NAME=${PWD##*/}
file_dir="$html_address/$domain/$DIR_NAME"
file_config=/etc/nginx/domain_routes/$domain.$DIR_NAME.conf
config="location /api {
    proxy_set_header    Host             \$host;
    proxy_set_header    X-Real-IP        \$remote_addr;
    proxy_set_header    X-Forwarded-For  \$proxy_add_x_forwarded_for;
    proxy_set_header    X-Forwarded-Proto https;
    proxy_pass http://localhost:9999/api;
}"

# Check whether domain is empty, then set file_dir to $html_address/$DIR_NAME
if [ -z "$domain" ]; then
    file_dir="$html_address/$DIR_NAME"
    file_config=/etc/nginx/domain_routes/$DIR_NAME.conf
fi

# Check if the /var/www/html/$domain directory exists
if [ ! -d "$html_address/$domain" ]; then
    echo "The /var/www/html/$domain directory does not exist. Please run the script from $github_gist."
    exit 1
fi

# Check whether dist is present or empty
if [ ! -d "dist" ] || [ -z "$(ls -A dist)" ]; then
    echo "dist is not present or empty. Please run the following command first:"
    echo "npm run build"
    exit 1
fi

# Check whether the directory's name contains a dot or a space
if [[ "$PWD" =~ \.|\  ]]; then
    echo "The directory's name contains a dot or a space. Please rename the directory and try again."
    exit 1
fi

# Check whether nginx is installed
if [ ! -x "$(command -v nginx)" ]; then
    echo "nginx is not installed. Please install nginx first."
    exit 1
fi

# Check whether nginx config within this repository is present
if [ ! -f "nginx/conf/nginx.conf" ]; then
    echo "nginx config not found. Please run this script from the root of the repository or make sure the nginx config is present in the nginx/conf directory."
    exit 1
fi

# Create the directory $file_dir if it does not exist
if [ ! -d "$file_dir" ]; then
    sudo mkdir -p $file_dir
fi

# Create the directory /etc/nginx/domain_routes if it does not exist
if [ ! -d "/etc/nginx/domain_routes" ]; then
    sudo mkdir -p /etc/nginx/domain_routes
fi

# Copy nginx config to /etc/nginx/domain_routes
echo "$config" | sudo tee $file_config > /dev/null

# Copy the distribution to the directory if it contains index.html
if [ -d "dist" ] && [ -f "dist/index.html" ]; then
    sudo cp -r dist/* $file_dir
fi

# Check whether syntax of nginx config is correct
if [ ! -x "$(command -v nginx -t)" ]; then
    echo "nginx -t is not available. Please check the nginx config."
    remove_config_and_dist
fi

# Check whether syntax of nginx config is correct
output=$(sudo nginx -t 2>&1)
if [[ $output == *"test is successful"* ]]; then
    echo "nginx config for $DIR_NAME is valid."
else
    echo "$output"
    echo "nginx config for $DIR_NAME is invalid. Please check the nginx config."
    remove_config_and_dist
    exit 1
fi

# Reload nginx
sudo nginx -s reload
echo "nginx has been reloaded."