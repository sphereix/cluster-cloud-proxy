#!/bin/bash

# Exit on any error
set -e

# Function to print status messages
print_status() {
    echo "➜ $1"
}

# Function to generate secure random string
generate_secure_string() {
    openssl rand -base64 32 | tr -d '/+=' | cut -c1-24
}

# Function to wait for service health
wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=1

    print_status "Waiting for ${service} to be healthy..."
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps $service | grep -q "healthy"; then
            print_status "${service} is healthy!"
            return 0
        fi
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    print_status "Failed to verify ${service} health after ${max_attempts} attempts"
    return 1
}

# Check if running as root
if [ "$(id -u)" != "0" ]; then
    print_status "This script requires root privileges. Running with sudo..."
    sudo bash "$0" "$@"
    exit $?
fi

# Create installation directory
INSTALL_DIR="/opt/proxy-manager"
mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Update package list
print_status "Updating package list..."
apt-get update

# Install required packages
print_status "Installing required packages..."
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    gnupg \
    lsb-release \
    fail2ban \
    goaccess \
    apache2-utils # For htpasswd utility

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
fi

# Install Docker Compose if not already installed
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Generate secure credentials
print_status "Generating secure credentials..."
CONSUL_TOKEN=$(generate_secure_string)
PROMETHEUS_USERNAME="admin"
PROMETHEUS_PASSWORD=$(generate_secure_string)

# Create project directory structure
print_status "Creating project directory structure..."
mkdir -p {nginx,varnish,consul,prometheus,grafana,logs,scripts}
mkdir -p nginx/{conf.d,sites,modsecurity}
mkdir -p varnish/sites
mkdir -p prometheus/{auth,config}
mkdir -p logs/{nginx,varnish}
mkdir -p consul/{config,data}
mkdir -p grafana/provisioning/{datasources,dashboards}

# Create Nginx configuration
print_status "Creating Nginx configuration..."
cat > nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for" '
                    'rt=$request_time uct="$upstream_connect_time" uht="$upstream_header_time" urt="$upstream_response_time" '
                    'cache_status=$upstream_cache_status';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;

    gzip on;
    gzip_disable "msie6";
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=MAIN:10m max_size=10g inactive=60m use_temp_path=off;

    server {
        listen 8080;
        server_name localhost;
        
        location /stub_status {
            stub_status;
        }
    }

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites/*.conf;
}
EOF

# Create example site configuration
cat > nginx/sites/example.conf << 'EOF'
upstream example_backend {
    least_conn;
    server backend1.example.com:80 max_fails=3 fail_timeout=30s;
    server backend2.example.com:80 max_fails=3 fail_timeout=30s backup;
}

server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://example_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        health_check interval=5s fails=3 passes=2;
    }
}
EOF

# Create Varnish configuration
print_status "Creating Varnish configuration..."
cat > varnish/default.vcl << 'EOF'
vcl 4.1;

backend default {
    .host = "nginx";
    .port = "80";
    .probe = {
        .url = "/health";
        .timeout = 2s;
        .interval = 5s;
        .window = 5;
        .threshold = 3;
    }
}

sub vcl_recv {
    if (req.method != "GET" && req.method != "HEAD") {
        return(pass);
    }

    if (req.http.Authorization) {
        return(pass);
    }

    return(hash);
}

sub vcl_backend_response {
    set beresp.ttl = 1h;
    set beresp.grace = 1h;

    if (beresp.status >= 500) {
        set beresp.uncacheable = true;
        return(deliver);
    }

    return(deliver);
}

sub vcl_deliver {
    if (obj.hits > 0) {
        set resp.http.X-Cache = "HIT";
    } else {
        set resp.http.X-Cache = "MISS";
    }
    return(deliver);
}
EOF

# Configure Consul ACL
print_status "Configuring Consul..."
cat > consul/config/acl.json << EOF
{
  "acl": {
    "enabled": true,
    "default_policy": "deny",
    "down_policy": "extend-cache",
    "tokens": {
      "master": "${CONSUL_TOKEN}",
      "agent": "${CONSUL_TOKEN}"
    }
  }
}
EOF

# Configure Prometheus
print_status "Configuring Prometheus..."
cat > prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx-exporter:9113']

  - job_name: 'varnish'
    static_configs:
      - targets: ['varnish-exporter:9131']

  - job_name: 'consul'
    consul_sd_configs:
      - server: 'consul:8500'
        token: '${CONSUL_TOKEN}'
EOF

# Configure Prometheus authentication
print_status "Configuring Prometheus authentication..."
htpasswd -bc prometheus/auth/.htpasswd "${PROMETHEUS_USERNAME}" "${PROMETHEUS_PASSWORD}"

# Configure Prometheus web config
cat > prometheus/web.yml << EOF
basic_auth_users:
    ${PROMETHEUS_USERNAME}: $(htpasswd -nb -B "${PROMETHEUS_USERNAME}" "${PROMETHEUS_PASSWORD}" | cut -d ":" -f 2)
EOF

# Configure Grafana datasource
print_status "Configuring Grafana datasource..."
cat > grafana/provisioning/datasources/prometheus.yml << EOF
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    basicAuth: true
    basicAuthUser: ${PROMETHEUS_USERNAME}
    secureJsonData:
      basicAuthPassword: ${PROMETHEUS_PASSWORD}
    jsonData:
      timeInterval: "5s"
EOF

# Copy docker-compose.yml
print_status "Creating Docker Compose configuration..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  nginx:
    image: owasp/modsecurity-crs:nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/conf.d:/etc/nginx/conf.d
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/sites:/etc/nginx/sites
      - ./nginx/modsecurity:/etc/nginx/modsecurity
      - ./logs/nginx:/var/log/nginx
    depends_on:
      - varnish
    healthcheck:
      test: ["CMD", "nginx", "-t"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - proxy-net

  varnish:
    image: varnish:stable
    ports:
      - "8080:80"
    volumes:
      - ./varnish:/etc/varnish
    environment:
      - VARNISH_SIZE=2G
    command: -p default_ttl=3600 -p default_grace=3600
    depends_on:
      consul:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "varnishstat", "-1"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - proxy-net

  consul:
    image: consul:latest
    ports:
      - "8500:8500"
    volumes:
      - ./consul/config:/consul/config
      - ./consul/data:/consul/data
    environment:
      - CONSUL_ALLOW_PRIVILEGED_PORTS=true
    command: >
      agent -server -bootstrap-expect=1 -ui
      -client=0.0.0.0
      -config-dir=/consul/config
    healthcheck:
      test: ["CMD", "consul", "members"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - proxy-net

  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus:/etc/prometheus
      - ./prometheus/auth:/etc/prometheus/auth:ro
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--web.config.file=/etc/prometheus/web.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=15d'
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:9090/-/healthy"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - proxy-net

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    volumes:
      - grafana-storage:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
    depends_on:
      prometheus:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:3000/api/health"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - proxy-net

  nginx-exporter:
    image: nginx/nginx-prometheus-exporter:latest
    command:
      - -nginx.scrape-uri=http://nginx:8080/stub_status
    depends_on:
      nginx:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:9113/metrics"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - proxy-net

  varnish-exporter:
    image: jonnenauha/prometheus_varnish_exporter:latest
    command:
      - -varnish.addr=varnish:6082
      - -varnish.params-path=/etc/varnish/varnish.params
    depends_on:
      varnish:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "wget", "--spider", "http://localhost:9131/metrics"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - proxy-net

  goaccess:
    image: allinurl/goaccess:latest
    volumes:
      - ./logs/nginx:/var/log/nginx:ro
    command: --real-time-html -o /var/log/goaccess/report.html /var/log/nginx/access.log
    healthcheck:
      test: ["CMD", "pgrep", "goaccess"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - proxy-net

networks:
  proxy-net:
    driver: bridge

volumes:
  grafana-storage:
  prometheus_data:
EOF

# Start Docker services
print_status "Starting Docker services..."
docker-compose pull
docker-compose up -d

# Wait for all services to be healthy
print_status "Waiting for services to be healthy..."
services=("consul" "prometheus" "nginx" "varnish" "grafana" "nginx-exporter" "varnish-exporter" "goaccess")
for service in "${services[@]}"; do
    wait_for_service "$service"
done

# Configure Fail2Ban
print_status "Configuring Fail2Ban..."
cat > /etc/fail2ban/jail.local << EOF
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = ${INSTALL_DIR}/logs/nginx/error.log
maxretry = 5
findtime = 600
bantime = 3600

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = ${INSTALL_DIR}/logs/nginx/error.log
maxretry = 10
findtime = 600
bantime = 7200
EOF

systemctl restart fail2ban

# Configure ModSecurity
print_status "Configuring ModSecurity..."
curl -L https://raw.githubusercontent.com/SpiderLabs/ModSecurity/v3/master/modsecurity.conf-recommended \
    -o nginx/modsecurity/modsecurity.conf

# Save credentials to a secure file
print_status "Saving credentials..."
CREDS_FILE="${INSTALL_DIR}/credentials.txt"
cat > "$CREDS_FILE" << EOF
Backend Configuration Credentials
===============================

Consul:
  ACL Token: ${CONSUL_TOKEN}

Prometheus:
  URL: http://localhost:9090
  Username: ${PROMETHEUS_USERNAME}
  Password: ${PROMETHEUS_PASSWORD}

Grafana:
  URL: http://localhost:3000
  Username: admin
  Password: admin (change this!)

Services:
  Nginx: http://localhost:80
  Varnish: http://localhost:8080
  Consul UI: http://localhost:8500

IMPORTANT: Store these credentials securely and delete this file after configuring the backend!
EOF

chmod 600 "$CREDS_FILE"

print_status "Setup completed successfully!"
echo ""
echo "Your proxy manager has been installed to: ${INSTALL_DIR}"
echo ""
echo "Backend configuration credentials have been saved to: ${CREDS_FILE}"
echo "Use these credentials to configure the backend in the web admin panel."
echo ""
echo "Access your services at:"
echo "- Admin Interface: http://localhost"
echo "- Grafana: http://localhost:3000 (admin/admin)"
echo "- Consul UI: http://localhost:8500"
echo "- Prometheus: http://localhost:9090"
echo ""
echo "Security features enabled:"
echo "- ModSecurity WAF"
echo "- Fail2Ban"
echo "- Rate Limiting"
echo "- Traffic Monitoring"
echo ""
echo "IMPORTANT NEXT STEPS:"
echo "1. Configure the backend using the credentials in: ${CREDS_FILE}"
echo "2. Change the default Grafana password"
echo "3. Delete ${CREDS_FILE} after configuring the backend"