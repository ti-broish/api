module.exports = {
  apps: [
    {
      name: 'ti-broish-api-prod-20210711',
      script: 'dist/main.js',

      // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      env_production: {
        NODE_ENV: 'production',
      },
      instances: 4,
      error_file: 'var/log/err.log',
      out_file: 'var/log/out.log',
      log_file: 'var/log/combined.log',
    },
    {
      name: 'ti-broish-api-staging',
      script: 'dist/main.js',

      // Options reference: https://pm2.keymetrics.io/docs/usage/application-declaration/
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
      env_staging: {
        NODE_ENV: 'production', // This is intentional. We do not have a staging environment inside the app.
      },
      instances: 2,
      error_file: 'var/log/err.log',
      out_file: 'var/log/out.log',
      log_file: 'var/log/combined.log',
    },
  ],

  deploy: {
    'ti-broish-api-prod-20210711': {
      user: 'deploy',
      host: ['ti-broish-api'],
      ref: 'origin/main',
      repo: 'https://github.com/ti-broish/api.git',
      path: '/var/www/ti-broish-api-20210711',
      'post-setup': 'ls -la',
      'post-deploy':
        'npm ci --only=production --ignore-scripts --no-audit' +
        ' && npm run build' +
        ' && cp $PWD/../shared/.env $PWD/../shared/firebase.json $PWD/' +
        ' && NODE_ENV=production npm run migration:run' +
        ' && pm2 startOrReload ecosystem.config.js --env production',
    },
    'ti-broish-api-staging': {
      user: 'deploy',
      host: ['ti-broish-api'],
      ref: 'origin/main',
      repo: 'https://github.com/ti-broish/api.git',
      path: '/var/www/ti-broish-api-staging',
      'post-setup': 'ls -la',
      'post-deploy':
        'npm ci --only=production --ignore-scripts --no-audit' +
        ' && npm run build' +
        ' && cp $PWD/../shared/.env $PWD/../shared/firebase.json $PWD/' +
        ' && NODE_ENV=production npm run migration:run' +
        ' && pm2 startOrReload ecosystem.config.js --env ti-broish-api-staging',
    },
  },
};
