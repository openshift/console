import * as yup from 'yup';
import * as _ from 'lodash';
import { convertToBaseValue } from '@console/internal/components/utils';
import { isInteger } from '../../utils/yup-validation-util';
import { GitTypes } from './import-types';

const urlRegex = /^(((ssh|git|https?):\/\/[\w]+)|(git@[\w]+.[\w]+:))([\w\-._~/?#[\]!$&'()*+,;=])+$/;
const hostnameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
const pathRegex = /^\/.*$/;
const nameRegex = /^([a-z]([-a-z0-9]*[a-z0-9])?)*$/;
const projectNameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

export const validationSchema = yup.object().shape({
  name: yup
    .string()
    .matches(nameRegex, {
      message:
        'Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
      excludeEmptyString: true,
    })
    .max(253, 'Cannot be longer than 253 characters.')
    .required('Required'),
  project: yup.object().shape({
    name: yup
      .string()
      .matches(
        projectNameRegex,
        "Name must consist of lower case alphanumeric characters or '-' and must start and end with an alphanumeric character.",
      )
      .required('Required'),
  }),
  application: yup.object().shape({
    name: yup.string(),
    selectedKey: yup.string(),
  }),
  image: yup.object().when('build', {
    is: (build) => build.strategy !== 'Docker',
    then: yup.object().shape({
      selected: yup.string().required('Required'),
      tag: yup.string().required('Required'),
    }),
  }),
  git: yup.object().shape({
    url: yup
      .string()
      .max(2000, 'Please enter a URL that is less then 2000 characters.')
      .matches(urlRegex, 'Invalid Git URL.')
      .required('Required'),
    type: yup.string().when('showGitType', {
      is: true,
      then: yup.string().required('We failed to detect the git type. Please choose a git type.'),
    }),
    showGitType: yup.boolean(),
  }),
  docker: yup.object().when('build', {
    is: (build) => build.strategy === 'Docker',
    then: yup.object().shape({
      containerPort: yup.number().test(isInteger('Container port should be an Integer')),
    }),
  }),
  deployment: yup.object().shape({
    replicas: yup
      .number()
      .transform((cv) => (_.isNaN(cv) ? undefined : cv))
      .test(isInteger('Replicas must be an Integer.'))
      .min(0, 'Replicas must be greater than or equal to 0.')
      .max(
        Number.MAX_SAFE_INTEGER,
        `Replicas must be lesser than or equal to ${Number.MAX_SAFE_INTEGER}`,
      )
      .test({
        name: 'isEmpty',
        test: (value) => value !== undefined,
        message: 'This field cannot be empty.',
      }),
  }),
  serverless: yup.object().shape({
    enabled: yup.boolean(),
    scaling: yup.object().when('enabled', {
      is: true,
      then: yup.object({
        minpods: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .test(isInteger('Min Pods must be an Integer.'))
          .min(0, 'Min Pods must be greater than or equal to 0.')
          .max(
            Number.MAX_SAFE_INTEGER,
            `Min Pods must be lesser than or equal to ${Number.MAX_SAFE_INTEGER}`,
          ),
        maxpods: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .test(isInteger('Max Pods must be an Integer.'))
          .min(1, 'Max Pods must be greater than or equal to 1.')
          .max(
            Number.MAX_SAFE_INTEGER,
            `Max Pods must be lesser than or equal to ${Number.MAX_SAFE_INTEGER}`,
          )
          .test({
            test(limit) {
              const { minpods } = this.parent;
              return limit ? limit >= minpods : true;
            },
            message: 'Max Pods must be greater than or equal to Min Pods.',
          }),
        concurrencytarget: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .test(isInteger('Concurrency Target must be an Integer.'))
          .min(0, 'Concurrency Target must be greater than or equal to 0.')
          .max(
            Number.MAX_SAFE_INTEGER,
            `Concurrency Target must be lesser than or equal to ${Number.MAX_SAFE_INTEGER}`,
          ),
        concurrencylimit: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .test(isInteger('Concurrency Limit must be an Integer.'))
          .min(0, 'Concurrency Limit must be greater than or equal to 0.')
          .max(
            Number.MAX_SAFE_INTEGER,
            `Concurrency Limit must be lesser than or equal to ${Number.MAX_SAFE_INTEGER}`,
          ),
      }),
    }),
  }),
  route: yup.object().shape({
    secure: yup.boolean(),
    tls: yup.object().when('secure', {
      is: true,
      then: yup.object({
        termination: yup.string().required('Please select a termination type.'),
      }),
    }),
    hostname: yup
      .string()
      .matches(hostnameRegex, {
        message:
          'Hostname must consist of lower-case letters, numbers, periods, and hyphens. It must start and end with a letter or number.',
        excludeEmptyString: true,
      })
      .max(253, 'Cannot be longer than 253 characters.'),
    path: yup
      .string()
      .matches(pathRegex, { message: 'Path must start with /.', excludeEmptyString: true }),
  }),
  limits: yup.object().shape({
    cpu: yup.object().shape({
      request: yup
        .number()
        .transform((request) => (_.isNaN(request) ? undefined : request))
        .min(0, 'Request must be greater than or equal to 0.')
        .test({
          test(request) {
            const { requestUnit, limit, limitUnit } = this.parent;
            if (limit !== undefined) {
              return (
                convertToBaseValue(`${request}${requestUnit}`) <=
                convertToBaseValue(`${limit}${limitUnit}`)
              );
            }
            return true;
          },
          message: 'CPU request must be less than or equal to limit.',
        }),
      requestUnit: yup.string('Unit must be millicores or cores.'),
      limitUnit: yup.string('Unit must be millicores or cores.'),
      limit: yup
        .number()
        .transform((limit) => (_.isNaN(limit) ? undefined : limit))
        .min(0, 'Limit must be greater than or equal to 0.')
        .test({
          test(limit) {
            const { request, requestUnit, limitUnit } = this.parent;
            if (limit !== undefined) {
              return (
                convertToBaseValue(`${limit}${limitUnit}`) >=
                convertToBaseValue(`${request}${requestUnit}`)
              );
            }
            return true;
          },
          message: 'CPU limit must be greater than or equal to request.',
        }),
    }),
    memory: yup.object().shape({
      request: yup
        .number()
        .transform((request) => (_.isNaN(request) ? undefined : request))
        .min(0, 'Request must be greater than or equal to 0.')
        .test({
          test(request) {
            const { requestUnit, limit, limitUnit } = this.parent;
            if (limit !== undefined) {
              return (
                convertToBaseValue(`${request}${requestUnit}`) <=
                convertToBaseValue(`${limit}${limitUnit}`)
              );
            }
            return true;
          },
          message: 'Memory request must be less than or equal to limit.',
        }),
      requestUnit: yup.string('Unit must be Mi or Gi.'),
      limit: yup
        .number()
        .transform((limit) => (_.isNaN(limit) ? undefined : limit))
        .min(0, 'Limit must be greater than or equal to 0.')
        .test({
          test(limit) {
            const { request, requestUnit, limitUnit } = this.parent;
            if (limit !== undefined) {
              return (
                convertToBaseValue(`${request}${requestUnit}`) <=
                convertToBaseValue(`${limit}${limitUnit}`)
              );
            }
            return true;
          },
          message: 'Memory limit must be greater than or equal to request.',
        }),
      limitUnit: yup.string('Unit must be Mi or Gi.'),
    }),
  }),
  build: yup.object().shape({
    strategy: yup.string(),
  }),
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
