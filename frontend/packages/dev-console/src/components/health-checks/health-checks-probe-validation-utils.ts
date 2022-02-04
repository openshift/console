import i18next from 'i18next';
import * as yup from 'yup';

const pathRegex = /^\/.*$/;

export const MAX_INT32 = 2147483647;

export const healthChecksValidationSchema = () =>
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
          .integer(i18next.t('devconsole~Value must be an integer.'))
          .min(1, i18next.t('devconsole~Period must be greater than or equal to 1.'))
          .max(MAX_INT32, i18next.t('devconsole~Value is larger than maximum value allowed.')),
        initialDelaySeconds: yup
          .number()
          .integer(i18next.t('devconsole~Value must be an integer.'))
          .min(0, i18next.t('devconsole~Initial delay must be greater than or equal to 0.'))
          .max(MAX_INT32, i18next.t('devconsole~Value is larger than maximum value allowed.')),
        failureThreshold: yup
          .number()
          .integer(i18next.t('devconsole~Value must be an integer.'))
          .min(1, i18next.t('devconsole~Failure threshold must be greater than or equal to 1.')),
        timeoutSeconds: yup
          .number()
          .integer(i18next.t('devconsole~Value must be an integer.'))
          .min(1, i18next.t('devconsole~Timeout must be greater than or equal to 1.'))
          .max(MAX_INT32, i18next.t('devconsole~Value is larger than maximum value allowed.')),
        successThreshold: yup
          .number()
          .integer(i18next.t('devconsole~Value must be an integer.'))
          .min(1, i18next.t('devconsole~Success threshold must be greater than or equal to 1.'))
          .max(MAX_INT32, i18next.t('devconsole~Value is larger than maximum value allowed.')),
        requestType: yup.string(),
        httpGet: yup.object().when('requestType', {
          is: 'httpGet',
          then: yup.object({
            path: yup.string().matches(pathRegex, {
              message: i18next.t('devconsole~Path must start with /.'),
              excludeEmptyString: true,
            }),
            port: yup.number().required(i18next.t('devconsole~Required')),
          }),
        }),
        tcpSocket: yup.object().when('requestType', {
          is: 'tcpSocket',
          then: yup.object({
            port: yup.number().required(i18next.t('devconsole~Required')),
          }),
        }),
        exec: yup.object().when('requestType', {
          is: 'command',
          then: yup.object({
            command: yup.array().of(yup.string().required(i18next.t('devconsole~Required'))),
          }),
        }),
      }),
    }),
  });

export const healthChecksProbesValidationSchema = () =>
  yup.object().shape({
    readinessProbe: healthChecksValidationSchema(),
    livenessProbe: healthChecksValidationSchema(),
    startupProbe: healthChecksValidationSchema(),
  });
