function getConfig() {
  return {
    port: parseInt(process.env.PORT, 10) || 4000,
    nodeEnv: process.env.NODE_ENV || 'development',
    githubToken: process.env.GITHUB_TOKEN || null,
  };
}

module.exports = { getConfig };