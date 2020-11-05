import { TFunction } from 'i18next';
import * as yup from 'yup';

export const resourcesValidationSchema = (t: TFunction) =>
  yup.object().shape({
    resources: yup.array().of(
      yup.object().shape({
        name: yup.string().required(t('devconsole~Required')),
        type: yup.string().required(t('devconsole~Required')),
      }),
    ),
  });

export const parametersValidationSchema = (t: TFunction) =>
  yup.object().shape({
    parameters: yup.array().of(
      yup.object().shape({
        name: yup.string().required(t('devconsole~Required')),
        description: yup.string(),
        default: yup.string(),
      }),
    ),
  });
