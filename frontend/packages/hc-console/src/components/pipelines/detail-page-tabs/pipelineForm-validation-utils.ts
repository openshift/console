import * as yup from 'yup';

export const resourcesValidationSchema = yup.object().shape({
  resources: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Required'),
      type: yup.string().required('Required'),
    }),
  ),
});

export const parametersValidationSchema = yup.object().shape({
  parameters: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Required'),
      description: yup.string(),
      default: yup.string(),
    }),
  ),
});
