#!/bin/bash
# 阿里云轻量服务器初始化脚本
# 以 root 用户执行

set -e

echo "=== 更新系统 ==="
apt update && apt upgrade -y

echo "=== 安装 Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "=== 安装 PM2 ==="
npm install -g pm2

echo "=== 安装 Nginx ==="
apt install -y nginx

echo "=== 安装 Certbot (Let's Encrypt) ==="
apt install -y certbot python3-certbot-nginx

echo "=== 创建部署目录 ==="
mkdir -p /var/www/blog
mkdir -p /var/www/blog-api

echo "=== 设置目录权限 ==="
chown -R www-data:www-data /var/www/blog
chown -R $SUDO_USER:$SUDO_USER /var/www/blog-api

echo "=== 配置 PM2 开机启动 ==="
pm2 startup systemd -u $SUDO_USER --hp /home/$SUDO_USER

echo "=== 完成 ==="
echo ""
echo "后续步骤："
echo "1. 将 deploy/nginx.conf 复制到 /etc/nginx/sites-available/blog"
echo "2. 替换 YOUR_DOMAIN 为实际域名"
echo "3. ln -s /etc/nginx/sites-available/blog /etc/nginx/sites-enabled/"
echo "4. nginx -t && systemctl reload nginx"
echo "5. certbot --nginx -d YOUR_DOMAIN"
echo "6. 部署 API: cd /var/www/blog-api && npm install && pm2 start ecosystem.config.cjs"
echo "7. pm2 save"
