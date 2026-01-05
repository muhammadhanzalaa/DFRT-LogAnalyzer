# DFRT Log Analyzer - Deployment Guide

Complete step-by-step instructions for deploying the DFRT Log Analyzer in development, staging, and production environments.

## Table of Contents

- [Local Development Setup](#local-development-setup)
- [Docker Development](#docker-development)
- [Staging Deployment](#staging-deployment)
- [Production Deployment](#production-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Initialization](#database-initialization)
- [Monitoring & Maintenance](#monitoring--maintenance)
- [Troubleshooting](#troubleshooting)

## Local Development Setup

### Prerequisites

- Node.js v14.0.0 or higher
- npm v6.0.0 or higher
- Git
- Any code editor (VS Code recommended)

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd DFRT-LogAnalyzer/DFRT-LogAnalyzer
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Configure Environment

```bash
# Copy example configuration
cp .env.example .env

# Edit .env with development settings
nano .env
```

**Development .env Configuration:**

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=dev-secret-key-change-in-production
DATABASE_URL=sqlite:./dfrt.db
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
UPLOAD_DIR=./uploads
LOG_LEVEL=debug
```

### Step 4: Start Development Server

```bash
# With auto-reload
npm run dev

# Or standard start
npm start
```

Server will be available at: `http://localhost:5000`

### Step 5: Access Frontend

Navigate to: `http://localhost:5000/api/static/index.html`

### Step 6: Run Tests

```bash
npm test
```

## Docker Development

### Build Docker Image

```bash
docker build -t dfrt-analyzer:latest .
```

### Run Container

```bash
docker run -p 5000:5000 \
  -e NODE_ENV=development \
  -e JWT_SECRET=dev-secret \
  -v $(pwd)/uploads:/app/uploads \
  -v $(pwd)/logs:/app/logs \
  -v $(pwd)/dfrt.db:/app/dfrt.db \
  dfrt-analyzer:latest
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "5000:5000"
    environment:
      NODE_ENV: development
      JWT_SECRET: dev-secret-key
      DATABASE_URL: sqlite:./dfrt.db
      FRONTEND_URL: http://localhost:3000
    volumes:
      - ./uploads:/app/uploads
      - ./logs:/app/logs
      - ./dfrt.db:/app/dfrt.db
    networks:
      - dfrt-network

networks:
  dfrt-network:
    driver: bridge
```

Run with: `docker-compose up`

## Staging Deployment

### Prerequisites

- Linux server (Ubuntu 20.04+ recommended)
- Node.js installed
- Nginx or Apache configured
- SSL certificate

### Step 1: Clone Repository

```bash
cd /var/www
sudo git clone <repository-url>
sudo chown -R appuser:appuser DFRT-LogAnalyzer/
cd DFRT-LogAnalyzer/DFRT-LogAnalyzer
```

### Step 2: Install Dependencies

```bash
npm install --production
```

### Step 3: Configure Environment

```bash
cp .env.example .env

# Edit for staging
sudo nano .env
```

**Staging .env:**

```env
PORT=5000
NODE_ENV=staging
JWT_SECRET=<generate-strong-secret>
DATABASE_URL=sqlite:./dfrt.db
FRONTEND_URL=https://staging.dfrt-analyzer.com
BACKEND_URL=https://api.staging.dfrt-analyzer.com
LOG_LEVEL=info
```

### Step 4: Setup Process Manager

Install PM2:

```bash
sudo npm install -g pm2
```

Create ecosystem file (ecosystem.config.js):

```javascript
module.exports = {
  apps: [{
    name: 'dfrt-analyzer',
    script: './src/backend/server.js',
    instances: 2,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'staging'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

Start application:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 5: Configure Nginx

Create `/etc/nginx/sites-available/dfrt-analyzer`:

```nginx
server {
    listen 443 ssl http2;
    server_name api.staging.dfrt-analyzer.com;

    ssl_certificate /etc/letsencrypt/live/staging.dfrt-analyzer.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/staging.dfrt-analyzer.com/privkey.pem;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts for large file uploads
        proxy_connect_timeout 120;
        proxy_send_timeout 120;
        proxy_read_timeout 120;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        proxy_pass http://localhost:5000;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# HTTP redirect
server {
    listen 80;
    server_name api.staging.dfrt-analyzer.com;
    return 301 https://$server_name$request_uri;
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/dfrt-analyzer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 6: Backup Database

```bash
# Daily backup script
0 2 * * * /home/appuser/scripts/backup-db.sh
```

Backup script (`backup-db.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/dfrt-analyzer"
mkdir -p $BACKUP_DIR
cp /var/www/DFRT-LogAnalyzer/DFRT-LogAnalyzer/dfrt.db \
   $BACKUP_DIR/dfrt.db.$(date +%Y%m%d_%H%M%S)
```

## Production Deployment

### Prerequisites

- Dedicated Linux server (Ubuntu 20.04 LTS recommended)
- Domain name with DNS configured
- SSL certificate (Let's Encrypt recommended)
- Database backups configured
- Monitoring tools installed

### Step 1: Server Security Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install firewall
sudo apt install ufw -y
sudo ufw enable
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Install fail2ban
sudo apt install fail2ban -y
sudo systemctl enable fail2ban
```

### Step 2: User & Application Setup

```bash
# Create app user
sudo useradd -m -s /bin/bash dfrtapp
sudo usermod -aG sudo dfrtapp

# Setup application directory
sudo mkdir -p /opt/dfrt-analyzer
sudo chown dfrtapp:dfrtapp /opt/dfrt-analyzer
```

### Step 3: Install Application

```bash
su - dfrtapp
cd /opt/dfrt-analyzer
git clone <repository-url> .
npm install --production
cp .env.example .env
```

### Step 4: Production Configuration

```bash
nano .env
```

**Production .env (with strong secrets):**

```env
PORT=5000
NODE_ENV=production
JWT_SECRET=<use-openssl-rand-hex-32>
DATABASE_URL=sqlite:./dfrt.db
FRONTEND_URL=https://dfrt-analyzer.com
BACKEND_URL=https://api.dfrt-analyzer.com
UPLOAD_DIR=/var/dfrt-uploads
LOG_LEVEL=warn
LOG_DIR=/var/log/dfrt-analyzer
RATE_LIMIT_MAX_REQUESTS=50
CLEANUP_OLD_DATA_DAYS=90
```

Generate strong JWT secret:

```bash
openssl rand -hex 32
```

### Step 5: Database Setup

```bash
# Create uploads and logs directories
mkdir -p /var/dfrt-uploads
mkdir -p /var/log/dfrt-analyzer
sudo chown dfrtapp:dfrtapp /var/dfrt-uploads /var/log/dfrt-analyzer
```

### Step 6: Process Manager Setup

```bash
sudo npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'dfrt-analyzer',
    script: './src/backend/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/dfrt-analyzer/err.log',
    out_file: '/var/log/dfrt-analyzer/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    ignore_watch: ['node_modules', 'logs']
  }]
};
EOF

pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 7: Nginx Configuration

```bash
sudo tee /etc/nginx/sites-available/dfrt-analyzer > /dev/null << 'EOF'
server {
    listen 443 ssl http2;
    server_name api.dfrt-analyzer.com;

    ssl_certificate /etc/letsencrypt/live/dfrt-analyzer.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dfrt-analyzer.com/privkey.pem;

    # SSL Configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

    # Logging
    access_log /var/log/nginx/dfrt_access.log;
    error_log /var/log/nginx/dfrt_error.log;

    # Compression
    gzip on;
    gzip_vary on;
    gzip_types text/plain text/css application/json application/javascript;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        proxy_set_header X-Forwarded-Port $server_port;

        # Timeouts
        proxy_connect_timeout 60;
        proxy_send_timeout 60;
        proxy_read_timeout 60;
    }

    # Static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
}

# HTTP redirect
server {
    listen 80;
    server_name api.dfrt-analyzer.com;
    return 301 https://$server_name$request_uri;
}
EOF

sudo systemctl restart nginx
```

### Step 8: SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot certonly --nginx -d api.dfrt-analyzer.com
```

### Step 9: Backup & Recovery

Create backup script (`/opt/dfrt-analyzer/backup.sh`):

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/dfrt-analyzer"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

# Database backup
cp /opt/dfrt-analyzer/dfrt.db $BACKUP_DIR/dfrt.db.$DATE
gzip $BACKUP_DIR/dfrt.db.$DATE

# Upload files backup
tar -czf $BACKUP_DIR/uploads.$DATE.tar.gz /var/dfrt-uploads

# Keep last 30 days of backups
find $BACKUP_DIR -type f -mtime +30 -delete
```

Add to crontab:

```bash
# Backup every 6 hours
0 */6 * * * /opt/dfrt-analyzer/backup.sh
```

## Environment Configuration

### Security Environment Variables

```env
# JWT Configuration
JWT_SECRET=<strong-random-key-min-32-chars>
JWT_EXPIRY=24h

# File Upload Limits
MAX_FILE_SIZE=104857600        # 100MB
MAX_FILES=10

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # Per window

# CORS
FRONTEND_URL=https://dfrt-analyzer.com
CORS_ORIGIN=https://dfrt-analyzer.com
```

### Performance Environment Variables

```env
# Analysis Limits
ANALYSIS_TIMEOUT=3600000       # 1 hour
MAX_LOG_ENTRIES=100000

# Database
DATABASE_CLEANUP_DAYS=90       # Auto cleanup old data
DATABASE_CLEANUP_SCHEDULE=0 0 * * *  # Daily at midnight

# Logging
LOG_LEVEL=warn                 # Production: warn or error
```

## Database Initialization

The database is automatically initialized on first run. To manually initialize:

```bash
node -e "
const DbService = require('./src/backend/services/database.service');
DbService.initialize().then(() => {
  console.log('Database initialized');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
"
```

## Monitoring & Maintenance

### Health Check

```bash
curl https://api.dfrt-analyzer.com/api/health
```

### Log Monitoring

```bash
# Application logs
pm2 logs dfrt-analyzer

# Nginx logs
tail -f /var/log/nginx/dfrt_access.log
tail -f /var/log/nginx/dfrt_error.log

# System logs
journalctl -u dfrt-analyzer -f
```

### Database Maintenance

```bash
# Database statistics
sqlite3 dfrt.db ".database"

# Backup database
cp dfrt.db dfrt.db.backup

# Optimize database
sqlite3 dfrt.db "VACUUM;"
```

### Performance Monitoring

```bash
# Monitor processes
pm2 monit

# Check disk space
df -h

# Check memory usage
free -h
```

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs dfrt-analyzer

# Verify environment
cat .env | grep -v "^#"

# Check port
lsof -i :5000
```

### Database Errors

```bash
# Check database integrity
sqlite3 dfrt.db ".integrity_check"

# Restore from backup
cp /var/backups/dfrt-analyzer/dfrt.db.* ./dfrt.db
```

### High Memory Usage

```bash
# Restart application
pm2 restart dfrt-analyzer

# Check logs for issues
pm2 logs dfrt-analyzer --err
```

### SSL/Certificate Issues

```bash
# Check certificate validity
openssl x509 -in /etc/letsencrypt/live/dfrt-analyzer.com/fullchain.pem -text -noout

# Renew certificate
sudo certbot renew
```

## Support

For deployment issues or questions, refer to:
- [README.md](./README.md) - Main documentation
- [BACKEND_API_DOCS.md](./BACKEND_API_DOCS.md) - API documentation
- GitHub Issues - For bug reports

---

**Last Updated**: January 5, 2026  
**Version**: 3.0.0
