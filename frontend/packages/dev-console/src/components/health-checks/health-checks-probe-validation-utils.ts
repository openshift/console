import * as yup from 'yup';

const pathRegex = /^\/.*$/;

export const MAX_INT32 = 2147483647;

export const healthChecksValidationSchema = yup.object().shape({
  containerName: yup.string(),
  showForm: yup.boolean(),
  enabled: yup.boolean(),
  modified: yup.boolean(),
  data: yup.object().when('showForm', {
    is: true,
    then: yup.object().shape({
      periodSeconds: yup
        .number()
        .integer('Value must be an integer.')
        .min(1, 'Period must be greater than or equal to 1.')
        .max(MAX_INT32, 'Value is larger than maximum value allowed.'),
      initialDelaySeconds: yup
        .number()
        .integer('Value must be an integer.')
        .min(0, 'Initial Delay must be greater than or equal to 0.')
        .max(MAX_INT32, 'Value is larger than maximum value allowed.'),
      failureThreshold: yup
        .number()
        .integer('Value must be an integer.')
        .min(1, 'Failure Threshold must be greater than or equal to 1.'),
      timeoutSeconds: yup
        .number()
        .integer('Value must be an integer.')
        .min(1, 'Timeout must be greater than or equal to 1.')
        .max(MAX_INT32, 'Value is larger than maximum value allowed.'),
      successThreshold: yup
        .number()
        .integer('Value must be an integer.')
        .min(1, 'Success Threshold must be greater than or equal to 1.')
        .max(MAX_INT32, 'Value is larger than maximum value allowed.'),
      requestType: yup.string(),
      httpGet: yup.object().when('requestType', {
        is: 'httpGet',
        then: yup.object({
          path: yup
            .string()
            .matches(pathRegex, { message: 'Path must start with /.', excludeEmptyString: true }),
          port: yup.number().required('Required'),
        }),
      }),
      tcpSocket: yup.object().when('requestType', {
        is: 'tcpSocket',
        then: yup.object({
          port: yup.number().required('Required'),
        }),
      }),
      exec: yup.object().when('requestType', {
        is: 'command',
        then: yup.object({
          command: yup.array().of(yup.string().required('Required')),
        }),
      }),
    }),
  }),
});

export const healthChecksProbesValidationSchema = yup.object().shape({
  readinessProbe: healthChecksValidationSchema,
  livenessProbe: healthChecksValidationSchema,
  startupProbe: healthChecksValidationSchema,
});
