import * as yup from 'yup';

export const validationSchema = yup.object().shape({
  type: yup.string(),
  params: yup
    .object()
    .when('type', {
      is: 'git',
      then: yup.object({
        url: yup.string().required('Required'),
        revision: yup.string(),
      }),
    })
    .when('type', {
      is: 'image',
      then: yup.object({
        url: yup.string().required('Required'),
      }),
    })
    .when('type', {
      is: 'storage',
      then: yup.object({
        type: yup.string().required('Required'),
        location: yup.string().required('Required'),
        dir: yup.string(),
      }),
    })
    .when('type', {
      is: 'cluster',
      then: yup.object({
        name: yup.string().required('Required'),
        url: yup.string().required('Required'),
        username: yup.string().required('Required'),
        password: yup.string(),
        insecure: yup.string(),
      }),
    }),
  secrets: yup.object().when('type', {
    is: 'cluster',
    then: yup.object({
      cadata: yup.string().required('Required'),
      token: yup.string(),
    }),
  }),
});
