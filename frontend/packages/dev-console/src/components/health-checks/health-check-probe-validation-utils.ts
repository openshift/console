import * as yup from 'yup';

const pathRegex = /^\/.*$/;

export const getValidationSchema = yup.object().shape({
  failureThreshold: yup.number().min(1, 'Failure Threshold must be greater than or equal to 1.'),
  httpGet: yup.object({
    port: yup
      .string()
      .matches(/^\d+$/, { message: 'Port must be an Integer.', excludeEmptyString: true }),
    path: yup
      .string()
      .matches(pathRegex, { message: 'Path must start with /.', excludeEmptyString: true }),
  }),
  tcpSocket: yup.object({
    port: yup
      .string()
      .matches(/^\d+$/, { message: 'Port must be an Integer.', excludeEmptyString: true }),
  }),
  initialDelaySeconds: yup
    .number()
    .min(0, 'Initial Delay must be greater than or equal to 0.')
    .required('Required'),
  periodSeconds: yup
    .number()
    .min(1, 'Period must be greater than or equal to 1.')
    .required('Required'),
  timeoutSeconds: yup.number().min(1, 'Timeout must be greater than or equal to 1.'),
  successThreshold: yup.number().min(1, 'Success Threshold must be greater than or equal to 1.'),
});
