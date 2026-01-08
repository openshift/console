import { TFunction } from 'i18next';
import * as yup from 'yup';
import { nameValidationSchema } from '@console/shared';

export const getHelmOCIValidationSchema = (t: TFunction) => {
  return yup.object().shape({
    releaseName: nameValidationSchema(t),
    chartURL: yup
      .string()
      .required(t('helm-plugin~Required'))
      .test('is-oci-url', t('helm-plugin~Must be a valid OCI URL (e.g., oci://...)'), (value) => {
        if (!value) return false;
        return value.startsWith('oci://') || value.includes('://');
      }),
    chartVersion: yup.string().required(t('helm-plugin~Required')),
  });
};
