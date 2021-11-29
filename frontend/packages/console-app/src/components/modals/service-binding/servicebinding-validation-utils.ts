import { TFunction } from 'i18next';
import * as yup from 'yup';

export const serviceBindingValidationSchema = (t: TFunction) =>
  yup.object().shape({
    name: yup.string().required(t('console-app~Required')),
  });
