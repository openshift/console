import type { TFunction } from 'i18next';
import * as yup from 'yup';
import { nameValidationSchema } from '@console/shared';

export function getHelmChartURLValidationSchema(t: TFunction) {
  return yup.object().shape({
    releaseName: nameValidationSchema(t),
    chartURL: yup
      .string()
      .required(t('helm-plugin~Required'))
      .test(
        'is-valid-chart-url',
        t(
          'helm-plugin~Must be a valid OCI URL (e.g., oci://...) or a valid HTTP/HTTPS tarball URL (e.g., https://example.com/chart-1.0.0.tgz)',
        ),
        (value) => !!value?.match(/^(oci:\/\/.+)|(https?:\/\/.+\.(?:tar\.gz|tgz))$/),
      ),
    chartVersion: yup.string().required(t('helm-plugin~Required')),
  });
}
