import i18next from 'i18next';
import * as yup from 'yup';

export const removeTriggerSchema = () =>
  yup.object().shape({
    selectedTrigger: yup.string().required(i18next.t('pipelines-plugin~Required')),
  });
