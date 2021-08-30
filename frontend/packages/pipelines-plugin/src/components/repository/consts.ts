export enum RepositoryFields {
  REPOSITORY = 'Repository',
  BRANCH = 'Branch',
  URL_REPO = 'RepoUrl',
  URL_ORG = 'RepoOrg',
  SHA = 'sha',
  EVENT_TYPE = 'EventType',
}

export enum RepoAnnotationFields {
  SHA_MESSAGE = 'sha_message',
  SHA_URL = 'sha_url',
}

export const RepositoryLabels: Record<RepositoryFields, string> = {
  [RepositoryFields.REPOSITORY]: 'pipelinesascode.tekton.dev/repository',
  [RepositoryFields.BRANCH]: 'pipelinesascode.tekton.dev/branch',
  [RepositoryFields.URL_REPO]: 'pipelinesascode.tekton.dev/url-repository',
  [RepositoryFields.URL_ORG]: 'pipelinesascode.tekton.dev/url-org',
  [RepositoryFields.SHA]: 'pipelinesascode.tekton.dev/sha',
  [RepositoryFields.EVENT_TYPE]: 'pipelinesascode.tekton.dev/event-type',
};

export const RepositoryAnnotations: Record<RepoAnnotationFields, string> = {
  [RepoAnnotationFields.SHA_MESSAGE]: 'pipelinesascode.tekton.dev/sha-title',
  [RepoAnnotationFields.SHA_URL]: 'pipelinesascode.tekton.dev/sha-url',
};

export const baseURL = 'https://github.com';
