module.exports = {
  apps: [
    {
      name: 'blog-api',
      script: './index.js',
      cwd: '/var/www/blog-api',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
    },
  ],
};
