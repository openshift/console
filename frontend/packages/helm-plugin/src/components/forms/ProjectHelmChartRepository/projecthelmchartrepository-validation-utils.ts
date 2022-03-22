import { TFunction } from 'i18next';
import * as yup from 'yup';
import { nameRegex } from '@console/shared/src';

const urlRegex = /^https?:?:\/\/:?.+/;

export const createProjectHelmChartRepositoryValidationSchema = (t: TFunction) =>
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
