import * as yup from 'yup';

const pathRegex = /^\/.*$/;

export const healthChecksValidationSchema = yup.object().shape({
  showForm: yup.boolean(),
  enabled: yup.boolean(),
  data: yup.object().when('showForm', {
    is: true,
    then: yup.object().shape({
      periodSeconds: yup.number().min(1, 'Period must be greater than or equal to 1.'),
      initialDelaySeconds: yup.number().min(0, 'Initial Delay must be greater than or equal to 0.'),
      failureThreshold: yup
        .number()
        .min(1, 'Failure Threshold must be greater than or equal to 1.'),
      timeoutSeconds: yup.number().min(1, 'Timeout must be greater than or equal to 1.'),
      successThreshold: yup
        .number()
        .min(1, 'Success Threshold must be greater than or equal to 1.'),
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
