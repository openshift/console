import type { TFunction } from 'i18next';
import * as _ from 'lodash';
import * as yup from 'yup';
import { GitProvider } from '@console/git-service/src';
import { nameValidationSchema, nameRegex } from '@console/shared';
import { healthChecksProbesValidationSchema } from '../health-checks/health-checks-probe-validation-utils';
import { PipelineType } from '../pipeline-section/import-types';
import {
  projectNameValidationSchema,
  applicationNameValidationSchema,
  deploymentValidationSchema,
  serverlessValidationSchema,
  limitsValidationSchema,
  routeValidationSchema,
  imageValidationSchema,
  gitValidationSchema,
  dockerValidationSchema,
  buildValidationSchema,
  gitUrlRegex,
  resourcesValidationSchema,
  devfileValidationSchema,
  importFlowPipelineTemplateValidationSchema,
} from './validation-schema';

export const pipelinesAccessTokenValidationSchema = (t: TFunction) =>
  yup.object().shape({
    webhook: yup
      .object()
      .when('gitProvider', ([gitProvider], schema) =>
        gitProvider === GitProvider.BITBUCKET
          ? schema.shape({
              user: yup
                .string()
                .matches(nameRegex, {
                  message: t(
                    'devconsole~Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
                  ),
                  excludeEmptyString: true,
                })
                .required(t('devconsole~Required')),
            })
          : schema,
      )
      .when(['method', 'gitProvider', 'gitUrl'], ([method, gitProvider, gitUrl], schema) =>
        gitUrl &&
        gitProvider &&
        !(gitProvider === GitProvider.GITHUB && method === GitProvider.GITHUB)
          ? schema.shape({
              token: yup.string().test('oneOfRequired', t('devconsole~Required'), function () {
                return this.parent.token || this.parent.secretRef;
              }),
              secretRef: yup.string().test('oneOfRequired', t('devconsole~Required'), function () {
                return this.parent.token || this.parent.secretRef;
              }),
            })
          : schema,
      ),
  });

export const importFlowRepositoryValidationSchema = (t: TFunction) => {
  return yup.object().shape({
    repository: yup
      .object()
      .when(['pipelineType', 'pipelineEnabled'], ([pipelineType, pipelineEnabled], schema) =>
        pipelineType === PipelineType.PAC && pipelineEnabled
          ? pipelinesAccessTokenValidationSchema(t)
          : schema,
      ),
  });
};

export const validationSchema = (t: TFunction) =>
  yup.object().shape({
    name: nameValidationSchema(t),
    project: projectNameValidationSchema,
    application: applicationNameValidationSchema,
    image: imageValidationSchema(t),
    git: gitValidationSchema(t),
    docker: dockerValidationSchema(t),
    devfile: devfileValidationSchema(t),
    deployment: deploymentValidationSchema(t),
    serverless: serverlessValidationSchema(t),
    route: routeValidationSchema(t),
    limits: limitsValidationSchema(t),
    build: buildValidationSchema,
    resources: resourcesValidationSchema,
    healthChecks: healthChecksProbesValidationSchema(t),
    pac: importFlowRepositoryValidationSchema(t),
    pipeline: importFlowPipelineTemplateValidationSchema,
  });

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
  if (hasDomain(url, 'gitea.com') || url.includes('gitea')) {
    return GitProvider.GITEA;
  }
  // Not a known URL
  return GitProvider.UNSURE;
};

export const createComponentName = (nameString: string): string => {
  if (nameRegex.test(nameString)) {
    return nameString;
  }

  const kebabCaseStr = _.kebabCase(nameString);
  return nameString.match(/^\d/) || kebabCaseStr.match(/^\d/)
    ? `ocp-${kebabCaseStr}`
    : kebabCaseStr;
};

export const detectGitRepoName = (url: string): string | undefined => {
  if (!gitUrlRegex.test(url)) {
    return undefined;
  }
  const name = url.replace(/\/$/, '').split('/').pop();
  return createComponentName(name);
};
