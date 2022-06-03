import { GitProvider } from '@console/git-service/src';
import { RepositoryFormValues } from './types';

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

export enum PacConfigurationTypes {
  GITHUB = 'github',
  WEBHOOK = 'webhook',
}

export const defaultRepositoryFormValues: RepositoryFormValues = {
  gitUrl: '',
  gitProvider: GitProvider.INVALID,
  name: '',
  method: 'github',
  showOverviewPage: false,
  yamlData: ``,
  webhook: {
    token: '',
    method: 'token',
    secret: '',
    url: '',
  },
};

export const AccessTokenDocLinks = {
  [GitProvider.GITHUB]:
    'https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token',
  [GitProvider.GITLAB]: 'https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html',
  [GitProvider.BITBUCKET]: 'https://support.atlassian.com/bitbucket-cloud/docs/app-passwords/',
};

export const WebhookDocLinks = {
  [GitProvider.GITHUB]:
    'https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks',
  [GitProvider.GITLAB]:
    'https://docs.gitlab.com/ee/user/project/integrations/webhooks.html#configure-a-webhook-in-gitlab',
  [GitProvider.BITBUCKET]: 'https://support.atlassian.com/bitbucket-cloud/docs/manage-webhooks/',
  [GitProvider.UNSURE]:
    'https://docs.github.com/en/developers/webhooks-and-events/webhooks/creating-webhooks',
};
