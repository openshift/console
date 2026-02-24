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
          'helm-plugin~Must be a valid OCI URL (e.g., oci://registry.example.com/chart) or a valid HTTP/HTTPS tarball URL (e.g., https://example.com/chart-1.0.0.tgz)',
        ),
        (value) => {
          if (!value) return false;
          // OCI: require a registry hostname containing a dot or port
          if (/^oci:\/\/[a-zA-Z0-9][\w.-]*(?:\.\w+|:\d+)/.test(value)) return true;
          // HTTP(S): must end in .tgz or .tar.gz
          if (/^https?:\/\/[a-zA-Z0-9][\w.-]*(?:\.\w+|:\d+)\/.+\.(?:tar\.gz|tgz)$/.test(value))
            return true;
          return false;
        },
      ),
    chartVersion: yup.string().required(t('helm-plugin~Required')),
  });
}
