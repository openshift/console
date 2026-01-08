import type { FC } from 'react';
import { useEffect } from 'react';
import { TextInputTypes, Grid, GridItem } from '@patternfly/react-core';
import { FormikProps } from 'formik';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { InputField, FormFooter, FormBody, FormHeader, FlexForm } from '@console/shared';
import { HelmOCIChartFormData } from './types';

export interface HelmOCIChartFormProps {
  namespace: string;
  onNext: () => void;
}

const HelmOCIChartForm: FC<FormikProps<HelmOCIChartFormData> & HelmOCIChartFormProps> = ({
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
    if (values.chartURL) {
      const chartName = values.chartURL.split('/').pop() || ''; // e.g. "mychart:1.0.0"
      const chartVersion = chartName.split(':')[1] || '';
      if (chartName) {
        setFieldValue('releaseName', chartName.split(':')[0]);
      }
      if (chartVersion) {
        setFieldValue('chartVersion', chartVersion);
      }
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
          title={t('helm-plugin~Install Helm Chart from OCI Registry')}
          helpText={t(
            'helm-plugin~Enter the OCI chart URL and version to install a Helm chart from an OCI-compliant registry.',
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
                  'helm-plugin~The OCI registry URL for the Helm chart (e.g., oci://registry.example.com/charts/mychart).',
                )}
                placeholder="oci://registry.example.com/charts/mychart"
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

export default HelmOCIChartForm;
