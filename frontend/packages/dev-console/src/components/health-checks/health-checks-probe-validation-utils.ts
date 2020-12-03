import { TFunction } from 'i18next';
import * as yup from 'yup';

const pathRegex = /^\/.*$/;

export const MAX_INT32 = 2147483647;

export const healthChecksValidationSchema = (t: TFunction) =>
  yup.object().shape({
    containerName: yup.string(),
    showForm: yup.boolean(),
    enabled: yup.boolean(),
    modified: yup.boolean(),
    data: yup.object().when('showForm', {
      is: true,
      then: yup.object().shape({
        periodSeconds: yup
          .number()
          .integer(t('devconsole~Value must be an integer.'))
          .min(1, t('devconsole~Period must be greater than or equal to 1.'))
          .max(MAX_INT32, t('devconsole~Value is larger than maximum value allowed.')),
        initialDelaySeconds: yup
          .number()
          .integer(t('devconsole~Value must be an integer.'))
          .min(0, t('devconsole~Initial delay must be greater than or equal to 0.'))
          .max(MAX_INT32, t('devconsole~Value is larger than maximum value allowed.')),
        failureThreshold: yup
          .number()
          .integer(t('devconsole~Value must be an integer.'))
          .min(1, t('devconsole~Failure threshold must be greater than or equal to 1.')),
        timeoutSeconds: yup
          .number()
          .integer(t('devconsole~Value must be an integer.'))
          .min(1, t('devconsole~Timeout must be greater than or equal to 1.'))
          .max(MAX_INT32, t('devconsole~Value is larger than maximum value allowed.')),
        successThreshold: yup
          .number()
          .integer(t('devconsole~Value must be an integer.'))
          .min(1, t('devconsole~Success threshold must be greater than or equal to 1.'))
          .max(MAX_INT32, t('devconsole~Value is larger than maximum value allowed.')),
        requestType: yup.string(),
        httpGet: yup.object().when('requestType', {
          is: 'httpGet',
          then: yup.object({
            path: yup.string().matches(pathRegex, {
              message: t('devconsole~Path must start with /.'),
              excludeEmptyString: true,
            }),
            port: yup.number().required(t('devconsole~Required')),
          }),
        }),
        tcpSocket: yup.object().when('requestType', {
          is: 'tcpSocket',
          then: yup.object({
            port: yup.number().required(t('devconsole~Required')),
          }),
        }),
        exec: yup.object().when('requestType', {
          is: 'command',
          then: yup.object({
            command: yup.array().of(yup.string().required(t('devconsole~Required'))),
          }),
        }),
      }),
    }),
  });

export const healthChecksProbesValidationSchema = (t: TFunction) =>
  yup.object().shape({
    readinessProbe: healthChecksValidationSchema(t),
    livenessProbe: healthChecksValidationSchema(t),
    startupProbe: healthChecksValidationSchema(t),
  });
