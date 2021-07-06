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
      instances: 4,
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
      'pre-deploy':
        'npm ci --only=production --ignore-scripts' +
        ' && npm run build' +
        ' && cp $PWD/../shared/.env $PWD/../shared/firebase.json $PWD/' +
        ' && NODE_ENV=production npm run migration:run',
      'post-deploy': 'pm2 startOrReload ecosystem.config.js --env production',
    },
  },
};
