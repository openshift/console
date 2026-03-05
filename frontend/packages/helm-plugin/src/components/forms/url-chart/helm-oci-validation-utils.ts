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
          'helm-plugin~Must be a valid OCI URL or a valid HTTP/HTTPS tar file; for example - oci://registry.example.com/chart, https://example.com/chart-1.0.0.tgz.',
        ),
        (() => {
          const label = /[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/.source;
          const host = `${label}(?:\\.${label})*\\.?`;
          const ociRe = new RegExp(`^oci://${host}`, 'i');
          const httpRe = new RegExp(`^https?://${host}/.+\\.(?:tar\\.gz|tgz)$`, 'i');
          return (value: string) => value && (ociRe.test(value) || httpRe.test(value));
        })(),
      ),
    chartVersion: yup.string().required(t('helm-plugin~Required')),
  });
}
