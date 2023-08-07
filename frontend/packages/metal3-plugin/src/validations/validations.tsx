import { TFunction } from 'react-i18next';
import * as yup from 'yup';
import { RESOURCE_NAME_REGEX } from './regex';

export const nameValidationSchema = (t: TFunction<'metal3-plugin'>, maxLength = 263) =>
  yup
    .string()
    .matches(RESOURCE_NAME_REGEX, {
      message: t(
        'metal3-plugin~Name must consist of lower case alphanumeric characters, hyphens or dots, and must start and end with an alphanumeric character.',
      ),
      excludeEmptyString: true,
    })
    .max(
      maxLength,
      // see https://kubernetes.io/docs/concepts/overview/working-with-objects/names/#names
      t('metal3-plugin~Cannot be longer than {{characterCount}} characters.', {
        characterCount: maxLength,
      }),
    )
    .required(t('metal3-plugin~Required'));
