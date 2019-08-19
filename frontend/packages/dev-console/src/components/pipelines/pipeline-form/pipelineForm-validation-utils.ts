import * as yup from 'yup';

export const validationSchema = yup.object().shape({
  resources: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Required'),
      type: yup.string().required('Required'),
    }),
  ),
  parameters: yup.array().of(
    yup.object().shape({
      name: yup.string().required('Required'),
      description: yup.string().required('Required'),
      default: yup.string().required('Required'),
    }),
  ),
});
