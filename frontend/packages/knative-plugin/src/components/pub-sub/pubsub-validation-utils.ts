import * as yup from 'yup';

export const pubsubValidationSchema = yup.object().shape({
  metadata: yup.object().shape({ name: yup.string().required('Required') }),
});
