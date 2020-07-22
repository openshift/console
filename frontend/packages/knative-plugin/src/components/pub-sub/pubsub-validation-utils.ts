import * as yup from 'yup';

export const pubsubValidationSchema = yup.object().shape({
  metadata: yup.object().shape({ name: yup.string().required('Required') }),
  spec: yup.object().shape({
    subscriber: yup.object().shape({
      ref: yup.object().shape({
        kind: yup.string().required('Required'),
        apiVersion: yup.string().required('Required'),
        name: yup.string().required('Required'),
      }),
    }),
  }),
});
