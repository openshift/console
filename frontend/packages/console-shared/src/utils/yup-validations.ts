import i18next from 'i18next';
import * as yup from 'yup';

export const nameRegex = /^[a-z]([a-z0-9]-?)*[a-z0-9]$/;
export const nameValidationSchema = (maxLength = 263) =>
  yup
    .string()
    .matches(nameRegex, {
      message: i18next.t(
        'console-shared~Name must consist of lower-case letters, numbers and hyphens. It must start with a letter and end with a letter or number.',
      ),
      excludeEmptyString: true,
    })
    .max(
      maxLength,
      // see https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
      i18next.t('console-shared~Cannot be longer than {{characterCount}} characters.', {
        characterCount: maxLength,
      }),
    )
    .required(i18next.t('console-shared~Required'));
