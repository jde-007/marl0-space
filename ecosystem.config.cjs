module.exports = {
  apps: [{
    name: 'marl0-space',
    script: 'dist/server/entry.mjs',
    cwd: '/Users/thenuthouse/dev/github.com/jde-007/marl0-space',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 8888
    },
    error_file: '/Users/thenuthouse/.openclaw/workspace/logs/marl0-space-error.log',
    out_file: '/Users/thenuthouse/.openclaw/workspace/logs/marl0-space-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
