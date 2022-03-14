import { TFunction } from 'i18next';
import * as _ from 'lodash';
import * as yup from 'yup';
import { GitProvider } from '@console/git-service/src';
import { nameValidationSchema, nameRegex } from '@console/shared';
import { healthChecksProbesValidationSchema } from '../health-checks/health-checks-probe-validation-utils';
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
} from './validation-schema';

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
  const name = url
    .replace(/\/$/, '')
    .split('/')
    .pop();
  return createComponentName(name);
};
