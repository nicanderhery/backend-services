# If the script can not be launched, run the following command first:
# chmod +x nginx-install.sh

function remove_config() {
    sudo rm /etc/nginx/shared/$DIR_NAME.conf
    echo "nginx config for $DIR_NAME has been removed."
}

# Get the current directory name
DIR_NAME=${PWD##*/}

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

# Check whether nginx is running
if [ "$(systemctl is-active nginx)" != "active" ]; then
    echo "nginx is not running. Please start nginx first."
    exit 1
fi

# Check whether nginx config within this repository is present
if [ ! -f "nginx/conf/nginx.conf" ]; then
    echo "nginx config not found. Please run this script from the root of the repository or make sure the nginx config is present in the nginx/conf directory."
    exit 1
fi

# Check whether nginx config is the correct one
if ! grep -q "include /etc/nginx/shared/\*.conf;" /etc/nginx/conf.d/nginx.conf; then
    echo "Main nginx config is not correct. Please run the following script from this gist: https://gist.github.com/nicanderhery/2c06fb6f5688a59ce29046dd5ed3a512/raw/0724800e3991f95084e2ca2ce5e43f137e47e2fb/nginx-certbot.sh"
    exit 1
fi

# Create a directory for nginx config if it does not exist
if [ ! -d "/etc/nginx/shared" ]; then
    sudo mkdir /etc/nginx/shared
fi

# Copy nginx config to /etc/nginx/shared
sudo cp nginx/conf/nginx.conf /etc/nginx/shared/$DIR_NAME.conf

# Check whether syntax of nginx config is correct
if [ ! -x "$(command -v nginx -t)" ]; then
    echo "nginx -t is not available. Please check the nginx config."
    remove_config
fi

# Check whether syntax of nginx config is correct
output=$(sudo nginx -t 2>&1)
if [[ $output == *"test is successful"* ]]; then
    echo "nginx config for $DIR_NAME is valid."
else
    echo "nginx config for $DIR_NAME is invalid. Please check the nginx config."
    remove_config
    exit 1
fi

# Reload nginx
sudo nginx -s reload
echo "nginx has been reloaded."