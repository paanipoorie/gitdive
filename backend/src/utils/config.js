const requiredEnvVars = ['PORT', 'NODE_ENV'];

function validateEnv() {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

function getConfig() {
  validateEnv();
  return {
    port: parseInt(process.env.PORT, 10),
    nodeEnv: process.env.NODE_ENV,
    githubToken: process.env.GITHUB_TOKEN || null,
  };
}

module.exports = { getConfig, validateEnv };