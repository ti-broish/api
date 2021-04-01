module.exports = {
  apps : [{
    name: "ti-broish-demo",
    script: 'dist/main.js',

    // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    },
    instances: 1,
    error_file: 'err.log',
    out_file: 'out.log',
    log_file: 'combined.log',
  }],

  deploy : {
    production : {
      user : 'hkdobrev',
      host : ['ti-broish-api'],
      ref  : 'origin/main',
      repo : 'git@github.com:Da-Bulgaria/ti-broish-api.git',
      path : '/var/www/ti-broish-demo',
      'post-setup': 'ls -la',
      'pre-deploy' : 'npm ci --omit=dev && npm run build && cp $PWD/../shared/.env $PWD/../shared/firebase.json $PWD/ && NODE_ENV=production npm run migration:run && pm2 startOrReload demo-ecosystem.config.js --env production',
    }
  }
};
