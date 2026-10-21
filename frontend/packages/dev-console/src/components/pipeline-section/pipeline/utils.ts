import * as GitUrlParse from 'git-url-parse';
import { Base64 } from 'js-base64';
import * as _ from 'lodash';
import {
  k8sCreateResource,
  k8sPatchResource,
} from '@console/dynamic-plugin-sdk/src/utils/k8s/k8s-resource';
import { getGitService } from '@console/git-service/src/services/git-service';
import { GitProvider } from '@console/git-service/src/types/git';
import { SecretType } from '@console/internal/components/secrets/create-secret/types';
import { SecretModel } from '@console/internal/models';
import type {
  ConfigMapKind,
  K8sResourceKind,
  SecretKind,
} from '@console/internal/module/k8s/types';
import { nameRegex } from '@console/shared/src/utils/yup-validations';
import { PIPELINE_STRATEGY_LABEL } from '../../../const';
import { RepositoryModel } from '../../../models/pipelines';
import type { PipelineKind } from '../../../types/pipeline';
import type { RepositoryFormValues } from '../../import/import-types';
import { detectGitType } from '../../import/import-validation-utils';
import { gitUrlRegex } from '../../import/validation-schema';

export const dryRunOpt = { dryRun: 'All' };
export const gitProviderTypesHosts = ['github.com', 'bitbucket.org', 'gitlab.com'];

export const createRepositoryName = (nameString: string): string => {
  if (nameRegex.test(nameString)) {
    return `git-${nameString}`;
  }
  return `git-${_.kebabCase(nameString)}`;
};

export const recommendRepositoryName = (url: string): string | undefined => {
  if (!gitUrlRegex.test(url)) {
    return undefined;
  }
  const name = url.replace(/\/$/, '').split('/').pop();
  return createRepositoryName(name);
};

export const isDockerPipeline = (template: PipelineKind): boolean =>
  template?.metadata?.labels?.[PIPELINE_STRATEGY_LABEL] === 'docker';

export const defaultRepositoryFormValues: RepositoryFormValues = {
  gitUrl: '',
  githubAppAvailable: false,
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
    user: '',
    autoAttach: false,
  },
};

const createTokenSecret = async (
  repositoryName: string,
  user: string,
  token: string,
  namespace: string,
  detectedGitType: GitProvider,
  webhookSecret?: string,
  dryRun?: boolean,
) => {
  const data: SecretKind = {
    apiVersion: SecretModel.apiVersion,
    kind: SecretModel.kind,
    metadata: {
      generateName: `${repositoryName}-token-`,
      namespace,
    },
    type: SecretType.opaque,
    stringData: {
      'provider.token': token,
      ...(webhookSecret && { 'webhook.secret': webhookSecret }),
      ...(detectedGitType === GitProvider.BITBUCKET && {
        'webhook.auth': Base64.encode(`${user}:${token}`),
      }),
    },
  };

  return k8sCreateResource({
    model: SecretModel,
    data,
    ns: namespace,
    queryParams: dryRun ? dryRunOpt : {},
  });
};

export const createRepositoryResources = async (
  values: RepositoryFormValues,
  namespace: string,
  labels: { [key: string]: string } = {},
  dryRun?: boolean,
): Promise<K8sResourceKind> => {
  const {
    name,
    gitUrl,
    webhook: { secretObj, method, token, secret: webhookSecret, user },
  } = values;
  const encodedSecret = Base64.encode(webhookSecret);
  const detectedGitType = detectGitType(gitUrl);
  let secret: SecretKind;
  if (token && method === 'token') {
    secret = await createTokenSecret(
      name,
      user,
      token,
      namespace,
      detectedGitType,
      webhookSecret,
      dryRun,
    );
  } else if (
    method === 'secret' &&
    secretObj &&
    secretObj?.data?.['webhook.secret'] !== encodedSecret
  ) {
    await k8sPatchResource({
      model: SecretModel,
      resource: secretObj,
      data: [{ op: 'replace', path: `/data/webhook.secret`, value: Base64.encode(webhookSecret) }],
    });
  }
  const gitHost = GitUrlParse(gitUrl).source;
  const secretRef = secret || secretObj;
  const data = {
    kind: RepositoryModel.kind,
    apiVersion: 'pipelinesascode.tekton.dev/v1alpha1',
    metadata: {
      name,
      namespace,
      ...(labels || {}),
    },
    spec: {
      url: gitUrl,
      ...(secretRef || gitHost !== 'github.com'
        ? {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            git_provider: {
              ...(!gitProviderTypesHosts.includes(gitHost) ? { url: gitHost } : {}),
              ...(gitHost === 'bitbucket.org'
                ? {
                    user,
                  }
                : {}),
              ...(secretRef
                ? {
                    secret: {
                      name: secretRef?.metadata?.name,
                      key: 'provider.token',
                    },
                    // eslint-disable-next-line @typescript-eslint/naming-convention
                    webhook_secret: {
                      name: secretRef?.metadata?.name,
                      key: 'webhook.secret',
                    },
                  }
                : {}),
            },
          }
        : {}),
    },
  };

  const resource = await k8sCreateResource({
    model: RepositoryModel,
    data,
    ns: namespace,
    queryParams: dryRun ? dryRunOpt : {},
  });

  return resource;
};

export const createRemoteWebhook = async (
  values: RepositoryFormValues,
  pac: ConfigMapKind,
  loaded: boolean,
): Promise<boolean> => {
  const {
    gitUrl,
    webhook: { method, token, secret: webhookSecret, url: webhookURL, secretObj, user },
  } = values;
  const detectedGitType = detectGitType(gitUrl);
  const gitService = getGitService(gitUrl, detectedGitType);

  let sslVerification = true;
  if (loaded && pac?.data?.['webhook-ssl-verification'] === 'false') {
    sslVerification = false;
  }

  let authToken: string;
  if (detectedGitType === GitProvider.BITBUCKET) {
    authToken =
      method === 'token'
        ? Base64.encode(`${user}:${token}`)
        : Base64.decode(secretObj?.data?.['webhook.auth']);
  } else {
    authToken = method === 'token' ? token : Base64.decode(secretObj?.data?.['provider.token']);
  }

  const webhookCreationStatus = await gitService.createRepoWebhook(
    authToken,
    webhookURL,
    sslVerification,
    webhookSecret,
  );

  return webhookCreationStatus;
};
