import { TFunction } from 'i18next';
import * as yup from 'yup';

export const removeTriggerSchema = (t: TFunction) =>
  yup.object().shape({
    selectedTrigger: yup.string().required(t('pipelines-plugin~Required')),
  });
