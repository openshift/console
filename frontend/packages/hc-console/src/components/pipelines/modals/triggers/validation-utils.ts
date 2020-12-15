import * as yup from 'yup';

export const removeTriggerSchema = yup.object().shape({
  selectedTrigger: yup.string().required('Required'),
});
