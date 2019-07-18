import * as yup from 'yup';
import * as _ from 'lodash';
import { convertToBaseValue } from '@console/internal/components/utils';

const urlRegex = /^(((ssh|git|https?):\/\/[\w]+)|(git@[\w]+.[\w]+:))([\w\-._~/?#[\]!$&'()*+,;=])+$/;
const hostnameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
const pathRegex = /^\/.*$/;

export const validationSchema = yup.object().shape({
  name: yup.string().required('Required'),
  project: yup.object().shape({
    name: yup.string().required('Required'),
  }),
  application: yup.object().shape({
    name: yup.string().required('Required'),
    selectedKey: yup.string().required('Required'),
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
      .matches(urlRegex, 'Invalid Git URL.')
      .required('Required'),
    type: yup.string().when('showGitType', {
      is: true,
      then: yup.string().required('We failed to detect the git type. Please choose a git type.'),
    }),
    showGitType: yup.boolean(),
  }),
  deployment: yup.object().shape({
    replicas: yup
      .number()
      .integer('Replicas must be an Integer.')
      .min(0, 'Replicas must be greater than or equal to 0.')
      .test({
        name: 'isEmpty',
        test: (value) => value !== undefined,
        message: 'This field cannot be empty.',
      }),
  }),
  serverless: yup.object().shape({
    trigger: yup.boolean(),
    scaling: yup.object().when('trigger', {
      is: true,
      then: yup.object({
        minpods: yup
          .number()
          .integer('Min Pods must be an Integer.')
          .min(0, 'Min Pods must be greater than or equal to 0.'),
        maxpods: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .integer('Max Pods must be an Integer.')
          .min(1, 'Max Pods must be greater than or equal to 1.')
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
          .integer('Concurrency Target must be an Integer.')
          .min(0, 'Concurrency Target must be greater than or equal to 0.'),
        concurrencylimit: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .integer('Concurrency Limit must be an Integer.')
          .min(0, 'Concurrency Limit must be greater than or equal to 0.'),
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
        .nullable()
        .min(0, 'Request must be greater than or equal to 0.')
        .test({
          test(request) {
            const { requestUnit, limit, limitUnit } = this.parent;
            if (limit !== null) {
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
        .nullable()
        .min(0, 'Limit must be greater than or equal to 0.')
        .test({
          test(limit) {
            const { request, requestUnit, limitUnit } = this.parent;
            if (limit !== null) {
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
        .nullable()
        .min(0, 'Request must be greater than or equal to 0.')
        .test({
          test(request) {
            const { requestUnit, limit, limitUnit } = this.parent;
            if (limit !== null) {
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
        .nullable()
        .min(0, 'Limit must be greater than or equal to 0.')
        .test({
          test(limit) {
            const { request, requestUnit, limitUnit } = this.parent;
            if (limit !== null) {
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
    return undefined;
  }
  if (url.includes('github.com')) {
    return 'github';
  }
  if (url.includes('bitbucket.org')) {
    return 'bitbucket';
  }
  if (url.includes('gitlab.com')) {
    return 'gitlab';
  }
  return '';
};
