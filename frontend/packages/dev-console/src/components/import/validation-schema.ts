import i18next from 'i18next';
import * as _ from 'lodash';
import * as yup from 'yup';
import { convertToBaseValue } from '@console/internal/components/utils';
import { CREATE_APPLICATION_KEY } from '@console/topology/src/const';
import { isInteger } from '../../utils/yup-validation-util';
import { Resources } from './import-types';
import { removeKsvcInfoFromDomainMapping } from './serverless/serverless-utils';

const hostnameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
const pathRegex = /^\/.*$/;
const projectNameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/;

export const gitUrlRegex = /^((((ssh|git|https?:?):\/\/:?)(([^\s@]+@|[^@]:?)[-\w.]+(:\d\d+:?)?(\/[-\w.~/?[\]!$&'()*+,;=:@%]*:?)?:?))|([^\s@]+@[-\w.]+:[-\w.~/?[\]!$&'()*+,;=:@%]*?:?))$/;

const convertToSec = (value: number, unit: string): number => {
  switch (unit) {
    case 'm': {
      return value * 60;
    }
    case 'h': {
      return value * 3600;
    }
    default: {
      return value;
    }
  }
};

export const projectNameValidationSchema = yup.object().shape({
  name: yup
    .string()
    .matches(
      projectNameRegex,
      "Name must consist of lower case alphanumeric characters or '-' and must start and end with an alphanumeric character.",
    )
    .required('Required'),
});

export const applicationNameValidationSchema = yup.object().shape({
  selectedKey: yup.string(),
  name: yup
    .string()
    .max(63, 'Cannot be longer than 63 characters.')
    .when('selectedKey', {
      is: CREATE_APPLICATION_KEY,
      then: yup.string().required('Required'),
    }),
});

export const deploymentValidationSchema = () =>
  yup.object().shape({
    replicas: yup
      .number()
      .transform((cv) => (_.isNaN(cv) ? undefined : cv))
      .test(isInteger(i18next.t('devconsole~Replicas must be an integer.')))
      .min(0, i18next.t('devconsole~Replicas must be greater than or equal to 0.'))
      .max(
        Number.MAX_SAFE_INTEGER,
        i18next.t('devconsole~Replicas must be lesser than or equal to {{maxSafeInteger}}.', {
          maxSafeInteger: Number.MAX_SAFE_INTEGER,
        }),
      )
      .test({
        name: 'isEmpty',
        test: (value) => value !== undefined,
        message: i18next.t('devconsole~This field cannot be empty.'),
      }),
  });

export const resourcesValidationSchema = yup
  .string()
  .oneOf([Resources.OpenShift, Resources.Kubernetes, Resources.KnativeService])
  .required();

export const serverlessValidationSchema = () =>
  yup.object().when('resources', {
    is: Resources.KnativeService,
    then: yup.object().shape({
      scaling: yup.object({
        minpods: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .test(isInteger(i18next.t('devconsole~Min Pods must be an integer.')))
          .min(0, i18next.t('devconsole~Min Pods must be greater than or equal to 0.'))
          .max(
            Number.MAX_SAFE_INTEGER,
            i18next.t('devconsole~Min Pods must be lesser than or equal to {{maxSafeInteger}}.', {
              maxSafeInteger: Number.MAX_SAFE_INTEGER,
            }),
          ),
        maxpods: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .test(isInteger(i18next.t('devconsole~Max Pods must be an integer.')))
          .min(1, i18next.t('devconsole~Max Pods must be greater than or equal to 1.'))
          .max(
            Number.MAX_SAFE_INTEGER,
            i18next.t('devconsole~Max Pods must be lesser than or equal to {{maxSafeInteger}}.', {
              maxSafeInteger: Number.MAX_SAFE_INTEGER,
            }),
          )
          .test({
            test(limit) {
              const { minpods } = this.parent;
              return limit ? limit >= minpods : true;
            },
            message: i18next.t('devconsole~Max Pods must be greater than or equal to Min Pods.'),
          }),
        concurrencytarget: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .test(isInteger(i18next.t('devconsole~Concurrency target must be an integer.')))
          .min(0, i18next.t('devconsole~Concurrency target must be greater than or equal to 0.'))
          .max(
            Number.MAX_SAFE_INTEGER,
            i18next.t(
              'devconsole~Concurrency target must be lesser than or equal to {{maxSafeInteger}}.',
              {
                maxSafeInteger: Number.MAX_SAFE_INTEGER,
              },
            ),
          ),
        concurrencylimit: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .test(isInteger(i18next.t('devconsole~Concurrency limit must be an integer.')))
          .min(0, i18next.t('devconsole~Concurrency limit must be greater than or equal to 0.'))
          .max(
            Number.MAX_SAFE_INTEGER,
            i18next.t(
              'devconsole~Concurrency limit must be lesser than or equal to {{maxSafeInteger}}.',
              {
                maxSafeInteger: Number.MAX_SAFE_INTEGER,
              },
            ),
          ),
        concurrencyutilization: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .min(0, i18next.t('devconsole~Concurrency utilization must be between 0 and 100.'))
          .max(100, i18next.t('devconsole~Concurrency utilization must be between 0 and 100.')),
        autoscale: yup.object().shape({
          autoscalewindow: yup
            .number()
            .transform((cv) => (_.isNaN(cv) ? undefined : cv))
            .test({
              test(autoscalewindow) {
                if (autoscalewindow) {
                  const { autoscalewindowUnit } = this.parent;
                  const value = convertToSec(autoscalewindow, autoscalewindowUnit);
                  return value >= 6 && value <= 3600;
                }
                return true;
              },
              message: i18next.t('devconsole~Autoscale window must be between 6s and 1h.'),
            }),
        }),
      }),
      domainMapping: yup.array().of(
        yup
          .string()
          .transform(removeKsvcInfoFromDomainMapping)
          .matches(hostnameRegex, {
            message: i18next.t(
              'devconsole~Domain name must consist of lower-case letters, numbers, periods, and hyphens. It must start and end with a letter or number.',
            ),
            excludeEmptyString: true,
          })
          .test(
            'domainname-has-segements',
            i18next.t(
              'devconsole~Domain name must consist of at least two segments separated by dots.',
            ),
            function(domainName: string) {
              return domainName.split('.').length >= 2;
            },
          ),
      ),
    }),
  });

export const routeValidationSchema = () =>
  yup.object().shape({
    secure: yup.boolean(),
    tls: yup.object().when('secure', {
      is: true,
      then: yup.object({
        termination: yup
          .string()
          .required(i18next.t('devconsole~Please select a termination type.')),
      }),
    }),
    hostname: yup
      .string()
      .matches(hostnameRegex, {
        message: i18next.t(
          'devconsole~Hostname must consist of lower-case letters, numbers, periods, and hyphens. It must start and end with a letter or number.',
        ),
        excludeEmptyString: true,
      })
      .max(253, i18next.t('devconsole~Cannot be longer than 253 characters.')),
    path: yup.string().matches(pathRegex, {
      message: i18next.t('devconsole~Path must start with /.'),
      excludeEmptyString: true,
    }),
    unknownTargetPort: yup
      .number()
      .typeError(i18next.t('devconsole~Port must be an integer.'))
      .integer(i18next.t('devconsole~Port must be an integer.'))
      .min(1, i18next.t('devconsole~Port must be between 1 and 65535.'))
      .max(65535, i18next.t('devconsole~Port must be between 1 and 65535.')),
  });

export const limitsValidationSchema = () =>
  yup.object().shape({
    cpu: yup.object().shape({
      request: yup
        .number()
        .transform((request) => (_.isNaN(request) ? undefined : request))
        .min(0, i18next.t('devconsole~Request must be greater than or equal to 0.'))
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
          message: i18next.t('devconsole~CPU request must be less than or equal to limit.'),
        }),
      requestUnit: yup.string(i18next.t('devconsole~Unit must be millicores or cores.')).ensure(),
      limitUnit: yup.string(i18next.t('devconsole~Unit must be millicores or cores.')).ensure(),
      limit: yup
        .number()
        .transform((limit) => (_.isNaN(limit) ? undefined : limit))
        .min(0, i18next.t('devconsole~Limit must be greater than or equal to 0.'))
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
          message: i18next.t('devconsole~CPU limit must be greater than or equal to request.'),
        }),
    }),
    memory: yup.object().shape({
      request: yup
        .number()
        .transform((request) => (_.isNaN(request) ? undefined : request))
        .min(0, i18next.t('devconsole~Request must be greater than or equal to 0.'))
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
          message: i18next.t('devconsole~Memory request must be less than or equal to limit.'),
        }),
      requestUnit: yup.string(i18next.t('devconsole~Unit must be Mi or Gi.')),
      limit: yup
        .number()
        .transform((limit) => (_.isNaN(limit) ? undefined : limit))
        .min(0, i18next.t('devconsole~Limit must be greater than or equal to 0.'))
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
          message: i18next.t('devconsole~Memory limit must be greater than or equal to request.'),
        }),
      limitUnit: yup.string(i18next.t('devconsole~Unit must be Mi or Gi.')),
    }),
  });

export const imageValidationSchema = () =>
  yup.object().when('build', {
    is: (build) => build.strategy === 'Source',
    then: yup.object().shape({
      selected: yup.string().required(i18next.t('devconsole~Required')),
      tag: yup.string().required(i18next.t('devconsole~Required')),
    }),
  });

export const gitValidationSchema = () =>
  yup.object().shape({
    url: yup
      .string()
      .max(2000, i18next.t('devconsole~Please enter a URL that is less then 2000 characters.'))
      .matches(gitUrlRegex, i18next.t('devconsole~Invalid Git URL.'))
      .required(i18next.t('devconsole~Required')),
    type: yup.string().when('showGitType', {
      is: true,
      then: yup
        .string()
        .required(
          i18next.t('devconsole~We failed to detect the Git type. Please choose a Git type.'),
        ),
    }),
    showGitType: yup.boolean(),
  });

export const dockerValidationSchema = () =>
  yup.object().when('build', {
    is: (build) => build.strategy === 'Docker',
    then: yup.object().shape({
      containerPort: yup
        .number()
        .test(isInteger(i18next.t('devconsole~Container port should be an integer'))),
      dockerfilePath: yup.string().required(i18next.t('devconsole~Required')),
    }),
  });

export const devfileValidationSchema = () =>
  yup.object().when('build', {
    is: (build) => build.strategy === 'Devfile',
    then: yup.object().shape({
      devfileHasError: yup.boolean().oneOf([false]),
      devfilePath: yup.string().required(i18next.t('devconsole~Required')),
    }),
  });

export const buildValidationSchema = yup.object().shape({
  strategy: yup.string(),
});

export const searchTermValidationSchema = () =>
  yup.string().required(i18next.t('devconsole~Required'));

export const isiValidationSchema = () =>
  yup.object().shape({
    name: yup.string().required(i18next.t('devconsole~Required')),
    image: yup.object().required(i18next.t('devconsole~Required')),
    tag: yup.string(),
    status: yup.string().required(i18next.t('devconsole~Required')),
  });
