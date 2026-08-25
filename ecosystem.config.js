module.exports = {
  apps: [
    {
      name: "wa-bot-v15-production",
      script: "./index_v15_QA.mjs",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "450M",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
