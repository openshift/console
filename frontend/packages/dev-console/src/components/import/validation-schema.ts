import { TFunction } from 'i18next';
import * as _ from 'lodash';
import * as yup from 'yup';
import { convertToBaseValue } from '@console/internal/components/utils';
import { CREATE_APPLICATION_KEY } from '@console/topology/src/const';
import { isInteger } from '../../utils/yup-validation-util';
import { Resources } from './import-types';

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

export const deploymentValidationSchema = (t: TFunction) =>
  yup.object().shape({
    replicas: yup
      .number()
      .transform((cv) => (_.isNaN(cv) ? undefined : cv))
      .test(isInteger(t('devconsole~Replicas must be an integer.')))
      .min(0, t('devconsole~Replicas must be greater than or equal to 0.'))
      .max(
        Number.MAX_SAFE_INTEGER,
        t('devconsole~Replicas must be lesser than or equal to {{maxSafeInteger}}.', {
          maxSafeInteger: Number.MAX_SAFE_INTEGER,
        }),
      )
      .test({
        name: 'isEmpty',
        test: (value) => value !== undefined,
        message: t('devconsole~This field cannot be empty.'),
      }),
  });

export const resourcesValidationSchema = yup
  .string()
  .oneOf([Resources.OpenShift, Resources.Kubernetes, Resources.KnativeService])
  .required();

export const serverlessValidationSchema = (t: TFunction) =>
  yup.object().when('resources', {
    is: Resources.KnativeService,
    then: yup.object().shape({
      scaling: yup.object({
        minpods: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .test(isInteger(t('devconsole~Min Pods must be an integer.')))
          .min(0, t('devconsole~Min Pods must be greater than or equal to 0.'))
          .max(
            Number.MAX_SAFE_INTEGER,
            t('devconsole~Min Pods must be lesser than or equal to {{maxSafeInteger}}.', {
              maxSafeInteger: Number.MAX_SAFE_INTEGER,
            }),
          ),
        maxpods: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .test(isInteger(t('devconsole~Max Pods must be an integer.')))
          .min(1, t('devconsole~Max Pods must be greater than or equal to 1.'))
          .max(
            Number.MAX_SAFE_INTEGER,
            t('devconsole~Max Pods must be lesser than or equal to {{maxSafeInteger}}.', {
              maxSafeInteger: Number.MAX_SAFE_INTEGER,
            }),
          )
          .test({
            test(limit) {
              const { minpods } = this.parent;
              return limit ? limit >= minpods : true;
            },
            message: t('devconsole~Max Pods must be greater than or equal to Min Pods.'),
          }),
        concurrencytarget: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .test(isInteger(t('devconsole~Concurrency target must be an integer.')))
          .min(0, t('devconsole~Concurrency target must be greater than or equal to 0.'))
          .max(
            Number.MAX_SAFE_INTEGER,
            t('devconsole~Concurrency target must be lesser than or equal to {{maxSafeInteger}}.', {
              maxSafeInteger: Number.MAX_SAFE_INTEGER,
            }),
          ),
        concurrencylimit: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .test(isInteger(t('devconsole~Concurrency limit must be an integer.')))
          .min(0, t('devconsole~Concurrency limit must be greater than or equal to 0.'))
          .max(
            Number.MAX_SAFE_INTEGER,
            t('devconsole~Concurrency limit must be lesser than or equal to {{maxSafeInteger}}.', {
              maxSafeInteger: Number.MAX_SAFE_INTEGER,
            }),
          ),
        concurrencyutilization: yup
          .number()
          .transform((cv) => (_.isNaN(cv) ? undefined : cv))
          .min(0, t('devconsole~Concurrency utilization must be between 0 and 100.'))
          .max(100, t('devconsole~Concurrency utilization must be between 0 and 100.')),
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
              message: t('devconsole~Autoscale window must be between 6s and 1h.'),
            }),
        }),
      }),
    }),
  });

export const routeValidationSchema = (t: TFunction) =>
  yup.object().shape({
    secure: yup.boolean(),
    tls: yup.object().when('secure', {
      is: true,
      then: yup.object({
        termination: yup.string().required(t('devconsole~Please select a termination type.')),
      }),
    }),
    hostname: yup
      .string()
      .matches(hostnameRegex, {
        message: t(
          'devconsole~Hostname must consist of lower-case letters, numbers, periods, and hyphens. It must start and end with a letter or number.',
        ),
        excludeEmptyString: true,
      })
      .max(253, t('devconsole~Cannot be longer than 253 characters.')),
    path: yup.string().matches(pathRegex, {
      message: t('devconsole~Path must start with /.'),
      excludeEmptyString: true,
    }),
    unknownTargetPort: yup
      .number()
      .typeError(t('devconsole~Port must be an integer.'))
      .integer(t('devconsole~Port must be an integer.'))
      .min(1, t('devconsole~Port must be between 1 and 65535.'))
      .max(65535, t('devconsole~Port must be between 1 and 65535.')),
  });

export const limitsValidationSchema = (t: TFunction) =>
  yup.object().shape({
    cpu: yup.object().shape({
      request: yup
        .number()
        .transform((request) => (_.isNaN(request) ? undefined : request))
        .min(0, t('devconsole~Request must be greater than or equal to 0.'))
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
          message: t('devconsole~CPU request must be less than or equal to limit.'),
        }),
      requestUnit: yup.string(t('devconsole~Unit must be millicores or cores.')).ensure(),
      limitUnit: yup.string(t('devconsole~Unit must be millicores or cores.')).ensure(),
      limit: yup
        .number()
        .transform((limit) => (_.isNaN(limit) ? undefined : limit))
        .min(0, t('devconsole~Limit must be greater than or equal to 0.'))
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
          message: t('devconsole~CPU limit must be greater than or equal to request.'),
        }),
    }),
    memory: yup.object().shape({
      request: yup
        .number()
        .transform((request) => (_.isNaN(request) ? undefined : request))
        .min(0, t('devconsole~Request must be greater than or equal to 0.'))
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
          message: t('devconsole~Memory request must be less than or equal to limit.'),
        }),
      requestUnit: yup.string(t('devconsole~Unit must be Mi or Gi.')),
      limit: yup
        .number()
        .transform((limit) => (_.isNaN(limit) ? undefined : limit))
        .min(0, t('devconsole~Limit must be greater than or equal to 0.'))
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
          message: t('devconsole~Memory limit must be greater than or equal to request.'),
        }),
      limitUnit: yup.string(t('devconsole~Unit must be Mi or Gi.')),
    }),
  });

export const imageValidationSchema = (t: TFunction) =>
  yup.object().when('build', {
    is: (build) => build.strategy !== 'Docker' && build.strategy !== 'Devfile',
    then: yup.object().shape({
      selected: yup.string().required(t('devconsole~Required')),
      tag: yup.string().required(t('devconsole~Required')),
    }),
  });

export const gitValidationSchema = (t: TFunction) =>
  yup.object().shape({
    url: yup
      .string()
      .max(2000, t('devconsole~Please enter a URL that is less then 2000 characters.'))
      .matches(gitUrlRegex, t('devconsole~Invalid Git URL.'))
      .required(t('devconsole~Required')),
    type: yup.string().when('showGitType', {
      is: true,
      then: yup
        .string()
        .required(t('devconsole~We failed to detect the Git type. Please choose a Git type.')),
    }),
    showGitType: yup.boolean(),
  });

export const dockerValidationSchema = (t: TFunction) =>
  yup.object().when('build', {
    is: (build) => build.strategy === 'Docker',
    then: yup.object().shape({
      containerPort: yup
        .number()
        .test(isInteger(t('devconsole~Container port should be an integer'))),
    }),
  });

export const devfileValidationSchema = yup.object().when('build', {
  is: (build) => build.strategy === 'Devfile',
  then: yup.object().shape({
    devfileHasError: yup.boolean().oneOf([false]),
  }),
});

export const buildValidationSchema = yup.object().shape({
  strategy: yup.string(),
});

export const searchTermValidationSchema = (t: TFunction) =>
  yup.string().required(t('devconsole~Required'));

export const isiValidationSchema = (t: TFunction) =>
  yup.object().shape({
    name: yup.string().required(t('devconsole~Required')),
    image: yup.object().required(t('devconsole~Required')),
    tag: yup.string(),
    status: yup.string().required(t('devconsole~Required')),
  });
