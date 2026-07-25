const { z } = require('zod');

const githubUrlSchema = z.string().url().refine(
  (url) => /^https?:\/\/github\.com\/[^/]+\/[^/]+/.test(url),
  { message: 'Must be a valid GitHub repository URL (https://github.com/owner/repo)' }
);

const validateRepoRequestSchema = z.object({
  body: z.object({
    url: githubUrlSchema,
  }),
});

function parseGithubUrl(url) {
  const match = url.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/.*)?$/);
  if (!match) {
    return null;
  }
  return { owner: match[1], repo: match[2] };
}

function validateRepoUrl(req, res, next) {
  const result = validateRepoRequestSchema.safeParse({ body: req.body });
  if (!result.success) {
    return res.status(400).json({
      error: {
        message: 'Invalid request body',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten().fieldErrors,
      },
    });
  }
  req.validatedBody = result.data.body;
  next();
}

module.exports = {
  githubUrlSchema,
  validateRepoRequestSchema,
  parseGithubUrl,
  validateRepoUrl,
};