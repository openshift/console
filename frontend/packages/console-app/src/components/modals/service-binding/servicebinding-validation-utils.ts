import * as yup from 'yup';

export const serviceBindingValidationSchema = yup.object().shape({
  name: yup.string().required('Required'),
});
