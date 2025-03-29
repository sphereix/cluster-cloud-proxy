# Reverse Proxy System with Analytics

This system provides a robust reverse proxy solution with load balancing, failover capabilities, and detailed traffic analytics.

## Features

- Nginx reverse proxy with load balancing
- Automatic failover configuration
- Real-time traffic analytics with Prometheus and Grafana
- Service discovery and health monitoring with Consul
- Easy site configuration management

## Components

- **Nginx**: Main reverse proxy server
- **Consul**: Service discovery and health checks
- **Prometheus**: Metrics collection
- **Grafana**: Analytics visualization
- **Nginx Exporter**: Exports Nginx metrics to Prometheus

## Getting Started

1. Start the system:
   ```bash
   docker-compose up -d
   ```

2. Access the different services:
   - Grafana: http://localhost:3000 (admin/admin)
   - Consul UI: http://localhost:8500
   - Prometheus: http://localhost:9090

3. Add a new site:
   ```bash
   ./scripts/add-site.sh example.com backend1.example.com backend2.example.com
   ```

## Configuration

### Adding a New Site

Use the provided script to add a new site:

```bash
./scripts/add-site.sh <domain> <primary-backend> <backup-backend>
```

This will:
- Create a new site configuration
- Set up load balancing between backends
- Configure health checks
- Enable automatic failover

### Load Balancing Methods

Available in the site configuration:
- `least_conn`: Distributes load based on active connections
- `round_robin`: Default method, distributes requests sequentially
- `ip_hash`: Routes based on client IP (session persistence)

### Failover Configuration

Each backend server can be configured with:
- `max_fails`: Number of failed attempts before marking as down
- `fail_timeout`: Time period for fail counting
- `backup`: Marks server as backup (used when primary fails)

## Monitoring

### Grafana Dashboards

Access Grafana at http://localhost:3000 to view:
- Request rates and status codes
- Backend response times
- Error rates
- Load balancing distribution
- Health check status

### Health Checks

- Automated health monitoring via Consul
- Configurable check intervals and thresholds
- Automatic failover on backend failure