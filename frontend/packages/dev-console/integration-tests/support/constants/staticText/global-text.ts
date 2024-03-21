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
      'If this is a private repository, enter a source Secret in advanced Git options',
    buildDeployMessage: 'Repository URL to build and deploy your code from source',
    nonGitRepoMessage:
      'URL is valid but a git type could not be identified. Please select a git type from the git type dropdown below',
    gitUrlDevfileMessage: 'Repository URL to build and deploy your code from a Devfile.',
    rateLimitExceeded: 'Rate limit exceeded',
    unableToDetectBuilderImage: 'Unable to detect the Builder Image.',
  },
};
export const devWorkspaceStatuses = {
  stopped: 'Stopped',
  starting: 'Starting',
  running: 'Running',
};
