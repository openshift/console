import * as yup from 'yup';
import * as _ from 'lodash';
import { isInteger } from '../../utils/yup-validation-util';

const hostnameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
const pathRegex = /^\/.*$/;
const nameRegex = /^([a-z]([-a-z0-9]*[a-z0-9])?)*$/;

export const deployValidationSchema = yup.object().shape({
  project: yup.object().shape({
    name: yup.string().required('Required'),
  }),
  application: yup.object().shape({
    name: yup.string().required('Required'),
    selectedKey: yup.string().required('Required'),
  }),
  name: yup
    .string()
    .matches(nameRegex, {
      message:
        'Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
      excludeEmptyString: true,
    })
    .max(253, 'Cannot be longer than 253 characters.')
    .required('Required'),
  searchTerm: yup.string().required('Required'),
  isi: yup.object().shape({
    name: yup.string().required('Required'),
    image: yup.object().required('Required'),
    tag: yup.string().required('Required'),
    status: yup.string().required('Required'),
  }),
  serverless: yup.object().shape({
    enabled: yup.boolean(),
    scaling: yup.object().when('enabled', {
      is: true,
      then: yup.object({
        minpods: yup
          .number()
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
          .min(0, 'Concurrency Limit must be greater than or equal to 0.'),
      }),
    }),
  }),
  deployment: yup.object().shape({
    replicas: yup
      .number()
      .test(isInteger('Replicas must be an Integer.'))
      .min(0, 'Replicas must be greater than or equal to 0.')
      .max(
        Number.MAX_SAFE_INTEGER,
        `Replicas must be lesser than or equal to ${Number.MAX_SAFE_INTEGER}`,
      )
      .test({
        name: 'isEmpty',
        test: (value: any) => value !== undefined,
        message: 'This field cannot be empty.',
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
});
