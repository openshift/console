import type { FC } from 'react';
import { useEffect } from 'react';
import { TextInputTypes, Grid, GridItem } from '@patternfly/react-core';
import type { FormikProps } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField, FormFooter, FormBody, FormHeader, FlexForm } from '@console/shared';
import type { HelmURLChartFormData } from './types';

export interface HelmURLChartFormProps {
  namespace: string;
  onNext: () => void;
}

const HelmURLChartForm: FC<FormikProps<HelmURLChartFormData> & HelmURLChartFormProps> = ({
  handleReset,
  status,
  isSubmitting,
  onNext,
  isValid,
  dirty,
  values,
  setFieldValue,
}) => {
  const { t } = useTranslation();

  const isNextDisabled = !isValid || !dirty || isSubmitting;

  // Auto-populate releaseName and chartVersion from URL
  useEffect(() => {
    if (!values.chartURL) return;
    let url: URL;
    try {
      url = new URL(values.chartURL);
    } catch (error) {
      console.error(`Invalid chart URL: ${values.chartURL}`, error); // eslint-disable-line no-console
      return;
    }
    const scheme = url.protocol;
    const filename = url.pathname.split('/').pop() || '';
    let chartName = '';
    let chartVersion = '';

    if (scheme === 'oci:') {
      // e.g. "mychart:1.0.0" -> name "mychart", version "1.0.0"
      [chartName, chartVersion] = filename.split(':');
    } else {
      // e.g. "exateapigator-0.1.0.tgz" -> name "exateapigator", version "0.1.0"
      const base = filename.replace(/\.(tgz|tar\.gz)$/, '');

      // Handle semVer cases like "my-chart-1.0.0-rc.1.tgz, if the last hyphen is followed by a digit"
      const lastHyphen = base.lastIndexOf('-');
      if (lastHyphen >= 0 && lastHyphen < base.length - 1 && base[lastHyphen + 1].match(/^\d/)) {
        chartName = base.slice(0, lastHyphen);
        chartVersion = base.slice(lastHyphen + 1);
      }
    }

    if (chartName) {
      setFieldValue('releaseName', chartName);
    }
    if (chartVersion) {
      setFieldValue('chartVersion', chartVersion);
    }
  }, [values.chartURL, setFieldValue]);

  return (
    <FlexForm
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <FormBody flexLayout>
        <FormHeader
          title={t('helm-plugin~Install Helm Chart from URL')}
          helpText={t(
            'helm-plugin~Enter the chart URL (OCI or HTTP/HTTPS tarball) and version to install a Helm chart.',
          )}
          marginBottom="lg"
        />
        <FormSection fullWidth>
          <Grid hasGutter>
            <GridItem md={12}>
              <InputField
                type={TextInputTypes.text}
                name="chartURL"
                label={t('helm-plugin~Chart URL')}
                helpText={t(
                  'helm-plugin~The OCI URL or HTTP/HTTPS tarball URL for the Helm chart (e.g., oci://registry.example.com/charts/mychart or https://example.com/chart-1.0.0.tgz).',
                )}
                placeholder="oci://registry.example.com/charts/mychart or https://example.com/chart-1.0.0.tgz"
                required
                data-test="oci-chart-url"
              />
            </GridItem>
            <GridItem md={6}>
              <InputField
                type={TextInputTypes.text}
                name="releaseName"
                label={t('helm-plugin~Release name')}
                helpText={t('helm-plugin~A unique name for the Helm Release.')}
                required
                data-test="oci-release-name"
              />
            </GridItem>
            <GridItem md={6}>
              <InputField
                type={TextInputTypes.text}
                name="chartVersion"
                label={t('helm-plugin~Chart version')}
                helpText={t('helm-plugin~The version of the chart to install.')}
                placeholder="1.0.0"
                required
                data-test="oci-chart-version"
              />
            </GridItem>
          </Grid>
        </FormSection>
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status?.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('helm-plugin~Next')}
        disableSubmit={isNextDisabled}
        resetLabel={t('helm-plugin~Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default HelmURLChartForm;
