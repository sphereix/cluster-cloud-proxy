#!/bin/bash

# Check if all required parameters are provided
if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <domain> <backend1> <backend2>"
    exit 1
fi

DOMAIN=$1
BACKEND1=$2
BACKEND2=$3
CONFIG_FILE="nginx/sites/${DOMAIN}.conf"

# Create nginx configuration
cat > "$CONFIG_FILE" << EOF
upstream ${DOMAIN}_backend {
    least_conn;
    server ${BACKEND1}:80 max_fails=3 fail_timeout=30s;
    server ${BACKEND2}:80 max_fails=3 fail_timeout=30s backup;
}

server {
    listen 80;
    server_name ${DOMAIN};

    location / {
        proxy_pass http://${DOMAIN}_backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;

        health_check interval=5s fails=3 passes=2;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

echo "Site configuration for ${DOMAIN} has been created."
echo "Reloading Nginx configuration..."
docker-compose exec nginx nginx -s reload