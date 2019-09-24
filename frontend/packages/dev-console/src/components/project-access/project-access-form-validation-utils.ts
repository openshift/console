import * as yup from 'yup';

export const validationSchema = yup.object().shape({
  projectAccess: yup.array().of(
    yup.object().shape({
      user: yup.string().required('Required'),
      role: yup.string().required('Required'),
    }),
  ),
});
