import * as yup from 'yup';

export const validationSchema = yup.object({
  name: yup.string().required('Required'),
  params: yup.array().of(
    yup.object({
      name: yup
        .string()
        .min(1)
        .required('Required'),
      description: yup.string(),
      default: yup.string(),
    }),
  ),
  resources: yup.array().of(
    yup.object({
      name: yup
        .string()
        .min(1)
        .required('Required'),
      type: yup.string().required('Required'),
    }),
  ),
  tasks: yup
    .array()
    .min(1, 'Must define at least one task')
    .required('Required'),
});
