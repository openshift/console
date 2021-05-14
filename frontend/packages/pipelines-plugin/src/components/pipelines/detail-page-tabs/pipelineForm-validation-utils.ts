import i18next from 'i18next';
import * as yup from 'yup';

export const resourcesValidationSchema = () =>
  yup.object().shape({
    resources: yup.array().of(
      yup.object().shape({
        name: yup.string().required(i18next.t('pipelines-plugin~Required')),
        type: yup.string().required(i18next.t('pipelines-plugin~Required')),
      }),
    ),
  });

export const parametersValidationSchema = () =>
  yup.object().shape({
    parameters: yup.array().of(
      yup.object().shape({
        name: yup.string().required(i18next.t('pipelines-plugin~Required')),
        description: yup.string(),
        default: yup.string(),
      }),
    ),
  });
