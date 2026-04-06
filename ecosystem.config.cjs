module.exports = {
  apps: [{
    name: "attendance",
    script: "./dist/index.cjs",
    instances: 1,
    exec_mode: "cluster",
    env: {
      NODE_ENV: "production",
      PORT: 3000
    }
  }]
};
