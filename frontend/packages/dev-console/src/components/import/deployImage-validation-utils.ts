import * as yup from 'yup';

const hostnameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
const pathRegex = /^\/.*$/;

export const deployValidationSchema = yup.object().shape({
  project: yup.object().shape({
    name: yup.string().required('Required'),
  }),
  application: yup.object().shape({
    name: yup.string().required('Required'),
    selectedKey: yup.string().required('Required'),
  }),
  name: yup.string().required('Required'),
  searchTerm: yup.string().required('Required'),
  isi: yup.object().shape({
    name: yup.string().required('Required'),
    image: yup.object().required('Required'),
    tag: yup.string().required('Required'),
    status: yup.string().required('Required'),
  }),
  serverless: yup.object().shape({
    trigger: yup.boolean(),
  }),
  deployment: yup.object().shape({
    replicas: yup
      .number()
      .integer('Replicas must be an Integer.')
      .min(0, 'Replicas must be greater than or equal to 0.')
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
