export const adminNavigationMenu = {
  serverless: 'Serverless',
  pipelines: 'Pipelines',
};

export const messages = {
  helm: {
    noHelmReleasesFound: 'No Helm Releases found',
  },
  addFlow: {
    gitUrlValidated: 'Validated',
    noRoutesFound: 'No Routes found for this resource.',
    privateGitRepoMessage:
      'URL is valid but cannot be reached. If this is a private repository, enter a source Secret in advanced Git options',
    buildDeployMessage: 'Repository URL to build and deploy your code from source',
    rateLimitExceeded: 'Rate limit exceeded',
    unableToDetectBuilderImage: 'Unable to detect the Builder Image.',
  },
};
