import { TFunction } from 'i18next';
import * as yup from 'yup';

// eslint-disable-next-line no-useless-escape
export const nameRegex = /^[a-z0-9](?!.*\.\.)(?!.*-\.)(?!.*\.-)[a-z0-9\.-]*[a-z0-9]$/;
export const resourceNameRegex = /^[a-z]([a-z0-9-]?)*[a-z0-9]$/;
export const nameValidationSchema = (t: TFunction, maxLength = 263) =>
  yup
    .string()
    .matches(nameRegex, {
      message: t(
        'console-shared~Name must consist of lower case alphanumeric characters, hyphens or dots, and must start and end with an alphanumeric character.',
      ),
      excludeEmptyString: true,
    })
    .max(
      maxLength,
      // see https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
      t('console-shared~Cannot be longer than {{characterCount}} characters.', {
        characterCount: maxLength,
      }),
    )
    .required(t('console-shared~Required'));
