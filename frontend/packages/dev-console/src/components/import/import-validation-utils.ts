import * as yup from 'yup';
import * as _ from 'lodash';
import { GitTypes } from './import-types';
import {
  nameValidationSchema,
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
} from './validation-schema';
import { healthChecksProbesValidationSchema } from '../health-checks/health-check-probe-validation-utils';

export const validationSchema = yup.object().shape({
  name: nameValidationSchema,
  project: projectNameValidationSchema,
  application: applicationNameValidationSchema,
  image: imageValidationSchema,
  git: gitValidationSchema,
  docker: dockerValidationSchema,
  deployment: deploymentValidationSchema,
  serverless: serverlessValidationSchema,
  route: routeValidationSchema,
  limits: limitsValidationSchema,
  build: buildValidationSchema,
  resources: resourcesValidationSchema,
  healthChecks: healthChecksProbesValidationSchema,
});

const hasDomain = (url: string, domain: string): boolean => {
  return url.includes(`https://${domain}/`) || url.includes(`@${domain}:`);
};

export const detectGitType = (url: string): string => {
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

export const detectGitRepoName = (url: string): string | undefined => {
  if (!gitUrlRegex.test(url)) {
    return undefined;
  }

  return _.kebabCase(url.split('/').pop());
};
