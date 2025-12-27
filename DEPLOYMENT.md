# Deployment Guide for FakeAI

This guide covers deploying the FakeAI backend API to various hosting platforms.

## Important: Hosting Requirements

**IONOS Shared Hosting Does NOT Support Node.js Runtime**

IONOS shared hosting only supports Node.js at build time for static sites. You cannot run a Node.js server on IONOS shared hosting.

## Recommended Hosting Options

### Option 1: IONOS VPS (Recommended)

**Pros**: Full control, affordable, same provider
**Cost**: Starting from ~$2-10/month

#### Setup Steps:

1. **Order IONOS VPS**
   - Choose Ubuntu 22.04 LTS
   - Minimum 1GB RAM recommended

2. **Connect via SSH**
```bash
ssh root@your-vps-ip
```

3. **Install Node.js**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

4. **Install MySQL**
```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

5. **Create Database**
```bash
sudo mysql
CREATE DATABASE fakeai_db;
CREATE USER 'fakeai'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON fakeai_db.* TO 'fakeai'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

6. **Upload Your Code**
```bash
# On your local machine
cd backend
tar -czf backend.tar.gz .

# Upload to VPS
scp backend.tar.gz root@your-vps-ip:/var/www/

# On VPS
cd /var/www
tar -xzf backend.tar.gz
rm backend.tar.gz
```

7. **Install Dependencies**
```bash
cd /var/www
npm install --production
```

8. **Configure Environment**
```bash
nano .env
# Add your configuration
```

9. **Import Database Schema**
```bash
mysql -u fakeai -p fakeai_db < database/schema.sql
```

10. **Install PM2 (Process Manager)**
```bash
sudo npm install -g pm2
pm2 start server.js --name fakeai-api
pm2 save
pm2 startup
```

11. **Install Nginx (Reverse Proxy)**
```bash
sudo apt install nginx

# Create Nginx config
sudo nano /etc/nginx/sites-available/fakeai
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/fakeai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

12. **Setup SSL with Let's Encrypt**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 2: Railway.app (Easiest)

**Pros**: Free tier, automatic deployments, built-in MySQL
**Cost**: Free tier available, then pay-as-you-go

#### Setup Steps:

1. Go to [railway.app](https://railway.app)
2. Sign up with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add MySQL database from Railway marketplace
6. Set environment variables in Railway dashboard
7. Deploy!

### Option 3: Render.com

**Pros**: Free tier, easy setup, automatic SSL
**Cost**: Free tier available

#### Setup Steps:

1. Go to [render.com](https://render.com)
2. Sign up
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Configure:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && node server.js`
6. Add environment variables
7. Create MySQL database (paid) or use external MySQL
8. Deploy!

### Option 4: DigitalOcean App Platform

**Pros**: Reliable, scalable, good documentation
**Cost**: Starting from $5/month

#### Setup Steps:

1. Create DigitalOcean account
2. Create a new App
3. Connect GitHub repository
4. Configure build settings
5. Add MySQL database
6. Set environment variables
7. Deploy!

### Option 5: Hostinger VPS

**Pros**: Affordable, good performance
**Cost**: Starting from $4/month

Similar setup to IONOS VPS (follow Option 1 steps).

## Environment Variables

Make sure to set these environment variables on your hosting platform:

```env
PORT=5000
NODE_ENV=production
DB_HOST=your-mysql-host
DB_USER=your-mysql-user
DB_PASSWORD=your-mysql-password
DB_NAME=fakeai_db
DB_PORT=3306
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key
CORS_ORIGIN=https://your-domain.com
```

## Database Migration

### Export from Development
```bash
mysqldump -u root -p fakeai_db > fakeai_backup.sql
```

### Import to Production
```bash
mysql -u your_user -p fakeai_db < fakeai_backup.sql
```

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong JWT secret (generate with: `openssl rand -base64 32`)
- [ ] Enable HTTPS/SSL
- [ ] Set NODE_ENV=production
- [ ] Restrict CORS_ORIGIN to your domain
- [ ] Keep dependencies updated
- [ ] Use environment variables for secrets
- [ ] Enable firewall on VPS
- [ ] Regular database backups

## Monitoring

### PM2 Monitoring (VPS)
```bash
pm2 status
pm2 logs fakeai-api
pm2 monit
```

### Check Server Health
```bash
curl http://your-domain.com/health
```

## Updating Your Application

### VPS Deployment
```bash
# On your local machine
cd backend
git pull origin main
tar -czf backend.tar.gz .
scp backend.tar.gz root@your-vps-ip:/var/www/

# On VPS
cd /var/www
tar -xzf backend.tar.gz
npm install --production
pm2 restart fakeai-api
```

### Platform Deployments (Railway, Render, etc.)
- Just push to your GitHub repository
- Automatic deployment will trigger

## Troubleshooting

### Server won't start
- Check PM2 logs: `pm2 logs fakeai-api`
- Verify environment variables
- Check database connection

### Database connection error
- Verify MySQL is running: `sudo systemctl status mysql`
- Check credentials in .env
- Ensure database exists

### High memory usage
- Increase VPS RAM
- Optimize database queries
- Enable connection pooling

### SSL certificate issues
- Renew Let's Encrypt: `sudo certbot renew`
- Check Nginx configuration

## Backup Strategy

### Automated Daily Backups
```bash
# Create backup script
nano /root/backup.sh
```

Add:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
mysqldump -u fakeai -p'your_password' fakeai_db > /root/backups/fakeai_$DATE.sql
find /root/backups -name "fakeai_*.sql" -mtime +7 -delete
```

```bash
chmod +x /root/backup.sh
crontab -e
# Add: 0 2 * * * /root/backup.sh
```

## Cost Comparison

| Platform | Cost/Month | Pros | Cons |
|----------|-----------|------|------|
| Railway | Free - $20 | Easy, free tier | Limited free resources |
| Render | Free - $7 | Free tier, SSL | Free tier sleeps |
| IONOS VPS | $2 - $10 | Full control | Manual setup |
| DigitalOcean | $5 - $20 | Reliable | No free tier |
| Hostinger VPS | $4 - $12 | Affordable | Manual setup |

## Support

For deployment issues:
1. Check server logs
2. Verify environment variables
3. Test database connection
4. Check firewall rules
5. Review Nginx/proxy configuration
