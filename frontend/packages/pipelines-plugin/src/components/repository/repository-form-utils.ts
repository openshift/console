import * as GitUrlParse from 'git-url-parse';
import { TFunction } from 'i18next';
import { Base64 } from 'js-base64';
import * as _ from 'lodash';
import * as yup from 'yup';
import { gitUrlRegex } from '@console/dev-console/src/components/import/validation-schema';
import {
  k8sCreateResource,
  k8sGetResource,
  k8sListResourceItems,
  k8sPatchResource,
} from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { GitProvider } from '@console/git-service/src';
import { SecretType } from '@console/internal/components/secrets/create-secret';
import { ConfigMapModel, SecretModel } from '@console/internal/models';
import { ConfigMapKind, SecretKind, K8sResourceKind } from '@console/internal/module/k8s';
import { nameRegex } from '@console/shared/src';
import { RepositoryModel } from '../../models';
import { PAC_TEMPLATE_DEFAULT } from '../pac/const';
import { PIPELINE_NAMESPACE } from '../pipelines/const';
import { RepositoryFormValues } from './types';

export const dryRunOpt = { dryRun: 'All' };

export const repositoryValidationSchema = (t: TFunction) =>
  yup.object().shape({
    name: yup
      .string()
      .matches(nameRegex, {
        message: t(
          'pipelines-plugin~Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
        ),
        excludeEmptyString: true,
      })
      .required(t('pipelines-plugin~Required')),
    gitUrl: yup
      .string()
      .matches(gitUrlRegex, t('pipelines-plugin~Invalid Git URL.'))
      .required(t('pipelines-plugin~Required')),
    accessToken: yup.string(),
  });

const createTokenSecret = async (
  repositoryName: string,
  token: string,
  namespace: string,
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
  dryRun?: boolean,
): Promise<K8sResourceKind> => {
  const {
    name,
    gitUrl,
    webhook: { secretObj, method, token, secret: webhookSecret },
  } = values;
  const encodedSecret = Base64.encode(webhookSecret);
  let secret: SecretKind;
  if (token && method === 'token') {
    secret = await createTokenSecret(name, token, namespace, webhookSecret, dryRun);
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
    },
    spec: {
      url: gitUrl,
      ...(secretRef || gitHost !== 'github.com'
        ? {
            // eslint-disable-next-line @typescript-eslint/camelcase
            git_provider: {
              ...(gitHost !== 'github.com' ? { url: gitHost } : {}),
              ...(secretRef
                ? {
                    secret: {
                      name: secretRef?.metadata?.name,
                      key: 'provider.token',
                    },
                    // eslint-disable-next-line @typescript-eslint/camelcase
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

const hasDomain = (url: string, domain: string): boolean => {
  return (
    url.startsWith(`https://${domain}/`) ||
    url.startsWith(`https://www.${domain}/`) ||
    url.includes(`@${domain}:`)
  );
};

export const detectGitType = (url: string): GitProvider => {
  if (!gitUrlRegex.test(url)) {
    // Not a URL
    return GitProvider.INVALID;
  }
  if (hasDomain(url, 'github.com')) {
    return GitProvider.GITHUB;
  }
  if (hasDomain(url, 'bitbucket.org')) {
    return GitProvider.BITBUCKET;
  }
  if (hasDomain(url, 'gitlab.com')) {
    return GitProvider.GITLAB;
  }
  // Not a known URL
  return GitProvider.UNSURE;
};

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
  const name = url
    .replace(/\/$/, '')
    .split('/')
    .pop();
  return createRepositoryName(name);
};

export const getFallbackTemplate = (repoName: string): string => `apiVersion: tekton.dev/v1beta1
kind: PipelineRun
metadata:
  name: ${repoName ?? 'pull_request'}
  annotations:
    # The event we are targeting as seen from the webhook payload
    # this can be an array too, i.e: [pull_request, push]
    pipelinesascode.tekton.dev/on-event: "[pull_request, push]"

    # The branch or tag we are targeting (ie: main, refs/tags/*)
    pipelinesascode.tekton.dev/on-target-branch: "main"
    
    # Fetch the git-clone task from hub, we are able to reference later on it
    # with taskRef and it will automatically be embedded into our pipeline.
    pipelinesascode.tekton.dev/task: "git-clone"
    
    # You can add more tasks in here to reuse, browse the one you like from here
    # https://hub.tekton.dev/
    # example:
    # pipelinesascode.tekton.dev/task-2: "[maven, buildah]"

    # How many runs we want to keep attached to this event
    pipelinesascode.tekton.dev/max-keep-runs: "5"
spec:
  params:
    # The variable with brackets are special to Pipelines as Code
    # They will automatically be expanded with the events from Github.
    - name: repo_url
      value: "{{ repo_url }}"
    - name: revision
      value: "{{ revision }}"
  pipelineSpec:
    params:
      - name: repo_url
      - name: revision
    workspaces:
      - name: source
      - name: basic-auth
    tasks:
      - name: fetch-repository
        taskRef:
          name: git-clone
        workspaces:
          - name: output
            workspace: source
          - name: basic-auth
            workspace: basic-auth
        params:
          - name: url
            value: $(params.repo_url)
          - name: revision
            value: $(params.revision)
  
      # Customize this task if you like, or just do a taskRef
      # to one of the hub task.
      - name: noop-task
        runAfter:
          - fetch-repository
        workspaces:
          - name: source
            workspace: source
        taskSpec:
          workspaces:
            - name: source
          steps:
            - name: noop-task
              image: registry.access.redhat.com/ubi9/ubi-micro
              workingDir: $(workspaces.source.path)
              script: |
                exit 0
  workspaces:
  - name: source
    volumeClaimTemplate:
      spec:
        accessModes:
          - ReadWriteOnce
        resources:
          requests:
            storage: 1Gi
  # This workspace will inject secret to help the git-clone task to be able to
  # checkout the private repositories
  - name: basic-auth
    secret:
      secretName: "{{ git_auth_secret }}"`;

export const getPipelineRunDefaultTemplate = async (repoName: string): Promise<string> => {
  let pipelineRunTemplate = getFallbackTemplate(repoName);
  try {
    const template = await k8sGetResource<ConfigMapKind>({
      model: ConfigMapModel,
      ns: PIPELINE_NAMESPACE,
      name: PAC_TEMPLATE_DEFAULT,
    });
    if (template?.data?.template) {
      pipelineRunTemplate = template.data.template;
    }
  } catch (e) {
    console.log('failed to fetch default template:', e); // eslint-disable-line no-console
  }

  return pipelineRunTemplate;
};

export const getPipelineRunTemplate = async (
  runtime: string,
  repoName: string,
): Promise<string> => {
  let runTimeTemplate;
  try {
    const [pipelineRunTemplateCfg] = await k8sListResourceItems<ConfigMapKind>({
      model: ConfigMapModel,
      queryParams: {
        ns: PIPELINE_NAMESPACE,
        labelSelector: {
          matchLabels: {
            'pipelinesascode.openshift.io/runtime': runtime,
          },
        },
      },
    });
    runTimeTemplate = pipelineRunTemplateCfg?.data?.template;
  } catch (e) {
    console.log('failed to fetch runtime template:', e); // eslint-disable-line no-console
  }
  const pipelineRunTemplate = runTimeTemplate ?? (await getPipelineRunDefaultTemplate(repoName));
  return pipelineRunTemplate;
};
