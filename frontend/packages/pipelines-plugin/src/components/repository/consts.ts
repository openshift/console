export enum RepositoryFields {
  REPOSITORY = 'Repository',
  BRANCH = 'Branch',
  URL_REPO = 'RepoUrl',
  URL_ORG = 'RepoOrg',
  SHA = 'sha',
  EVENT_TYPE = 'EventType',
}

export const RepositoryLabels: Record<RepositoryFields, string> = {
  [RepositoryFields.REPOSITORY]: 'pipelinesascode.tekton.dev/repository',
  [RepositoryFields.BRANCH]: 'pipelinesascode.tekton.dev/branch',
  [RepositoryFields.URL_REPO]: 'pipelinesascode.tekton.dev/url-repository',
  [RepositoryFields.URL_ORG]: 'pipelinesascode.tekton.dev/url-org',
  [RepositoryFields.SHA]: 'pipelinesascode.tekton.dev/sha',
  [RepositoryFields.EVENT_TYPE]: 'pipelinesascode.tekton.dev/event-type',
};

export const baseURL = 'https://github.com';
