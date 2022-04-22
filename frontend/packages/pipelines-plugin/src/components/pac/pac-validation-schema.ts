import { TFunction } from 'i18next';
import * as yup from 'yup';
import { nameValidationSchema } from '@console/shared';

export const pacValidationSchema = (t: TFunction) =>
  yup.object().shape({
    applicationName: nameValidationSchema(t),
  });
