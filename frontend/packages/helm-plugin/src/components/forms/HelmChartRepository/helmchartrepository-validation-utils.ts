import { TFunction } from 'i18next';
import * as yup from 'yup';
import { nameRegex } from '@console/shared/src';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { HelmChartRepositoryData } from '../../../types/helm-types';

const urlRegex = /^https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]+\.[^\s]{2,}|www\.[a-zA-Z0-9]+\.[^\s]{2,}/;

export const createHelmChartRepositoryValidationSchema = (t: TFunction) =>
  yup.object().shape({
    repoName: yup
      .string()
      .matches(nameRegex, {
        message: t(
          'helm-plugin~Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
        ),
        excludeEmptyString: true,
      })
      .max(100, t('helm-plugin~The repository name cannot exceed than 100 characters.'))
      .required(t('helm-plugin~Required')),
    repoDescription: yup
      .string()
      .max(2048, t('helm-plugin~The repository name cannot exceed than 2048 characters.')),
    repoUrl: yup
      .string()
      .matches(urlRegex, {
        message: t('helm-plugin~Invalid Repo URL.'),
      })
      .max(2048, t('helm-plugin~Please enter a URL that is less then 2048 characters.'))
      .required(t('helm-plugin~Required')),
  });

export const validationSchema = (t: TFunction) =>
  yup.mixed().test({
    test(formValues: HelmChartRepositoryData) {
      const formYamlDefinition = yup.object({
        editorType: yup.string().oneOf(Object.values(EditorType)),
        yamlData: yup.string(),
        formData: yup.mixed().when('editorType', {
          is: EditorType.Form,
          then: createHelmChartRepositoryValidationSchema(t),
        }),
      });

      return formYamlDefinition.validate(formValues, { abortEarly: false });
    },
  });
