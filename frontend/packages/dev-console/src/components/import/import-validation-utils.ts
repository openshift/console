import { TFunction } from 'i18next';
import * as _ from 'lodash';
import * as yup from 'yup';
import { nameValidationSchema, nameRegex } from '@console/shared';
import { healthChecksProbesValidationSchema } from '../health-checks/health-checks-probe-validation-utils';
import { GitTypes } from './import-types';
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

export const detectGitType = (url: string): GitTypes => {
  if (!gitUrlRegex.test(url)) {
    // Not a URL
    return GitTypes.invalid;
  }
  if (hasDomain(url, 'github.com')) {
    return GitTypes.github;
  }
  if (hasDomain(url, 'bitbucket.org')) {
    return GitTypes.bitbucket;
  }
  if (hasDomain(url, 'gitlab.com')) {
    return GitTypes.gitlab;
  }
  // Not a known URL
  return GitTypes.unsure;
};

export const createComponentName = (nameString: string): string => {
  try {
    if (nameRegex.test(nameString)) {
      return nameString;
    }
    // eslint-disable-next-line no-empty
  } catch {}

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
