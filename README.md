# 学习笔记博客

基于 Docusaurus 构建的个人学习资料博客。

## 本地开发

```bash
npm install
npm run start
```

## 构建

```bash
npm run build
```

## 部署

推送到 main 分支后，GitHub Actions 自动构建并部署到服务器。

### 服务器配置

需要在 GitHub 仓库 Settings > Secrets 中配置：

- `SSH_PRIVATE_KEY`: 服务器 SSH 私钥
- `REMOTE_HOST`: 服务器 IP 或域名
- `REMOTE_USER`: SSH 用户名

### Nginx 配置

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/blog;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
}
```

## 添加内容

### 添加文档

在 `docs/` 目录下创建 Markdown 文件或文件夹。

### 添加博客

在 `blog/` 目录下创建 `YYYY-MM-DD-title/index.md`。

## 目录结构

```
docs/           # 文档（学习资料）
blog/           # 博客（时间线文章）
src/            # 源码（页面、组件）
static/         # 静态资源
```
