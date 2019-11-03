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
  urlRegex,
  resourcesValidationSchema,
} from './validation-schema';

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
});

export const detectGitType = (url: string): string => {
  if (!urlRegex.test(url)) {
    // Not a URL
    return GitTypes.invalid;
  }
  if (url.includes('github.com')) {
    return GitTypes.github;
  }
  if (url.includes('bitbucket.org')) {
    return GitTypes.bitbucket;
  }
  if (url.includes('gitlab.com')) {
    return GitTypes.gitlab;
  }
  // Not a known URL
  return GitTypes.unsure;
};

export const detectGitRepoName = (url: string): string | undefined => {
  if (!urlRegex.test(url)) {
    return undefined;
  }

  return _.kebabCase(url.split('/').pop());
};
