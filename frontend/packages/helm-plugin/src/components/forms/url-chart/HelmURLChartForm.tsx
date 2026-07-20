import type { FC } from 'react';
import { useEffect } from 'react';
import { TextInputTypes, Grid, GridItem } from '@patternfly/react-core';
import type { FormikProps } from 'formik';
import * as fuzzy from 'fuzzysearch';
import { useTranslation } from 'react-i18next';
import FormSection from '@console/dev-console/src/components/import/section/FormSection';
import { FlexForm } from '@console/shared/src/components/form-utils/FlexForm';
import { FormBody } from '@console/shared/src/components/form-utils/FormBody';
import { FormFooter } from '@console/shared/src/components/form-utils/FormFooter';
import { FormHeader } from '@console/shared/src/components/form-utils/FormHeader';
import { InputField } from '@console/shared/src/components/formik-fields/InputField';
import { ResourceDropdownField } from '@console/shared/src/components/formik-fields/ResourceDropdownField';
import type { HelmURLChartFormData } from './types';
import { useSecretResources } from './useSecretResources';

interface HelmURLChartFormProps {
  namespace: string;
  onNext: () => void;
}

const HelmURLChartForm: FC<FormikProps<HelmURLChartFormData> & HelmURLChartFormProps> = ({
  handleReset,
  status,
  isSubmitting,
  onNext,
  namespace,
  isValid,
  dirty,
  values,
  setFieldValue,
  setFieldError,
}) => {
  const { t } = useTranslation('helm-plugin');

  const autocompleteFilter = (strText: string, item: any): boolean =>
    fuzzy(strText, item?.props?.name);

  const secretResources = useSecretResources(namespace);
  const isNextDisabled = !isValid || !dirty || isSubmitting;

  // Auto-populate releaseName and chartVersion from URL
  useEffect(() => {
    if (!values.chartURL) return;
    let url: URL;
    try {
      url = new URL(values.chartURL);
    } catch {
      setFieldError('chartURL', t('Invalid chart URL format.'));
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
  }, [values.chartURL, setFieldValue, setFieldError, t]);

  return (
    <FlexForm
      onSubmit={(e) => {
        e.preventDefault();
        onNext();
      }}
    >
      <FormBody flexLayout>
        <FormHeader
          title={t('Install Helm Chart from URL')}
          helpText={t(
            'Enter an OCI registry URL or an HTTP/HTTPS .tar file link and version to install the chart.',
          )}
          marginBottom="lg"
        />
        <FormSection fullWidth>
          <Grid hasGutter>
            <GridItem md={12}>
              <InputField
                type={TextInputTypes.text}
                name="chartURL"
                label={t('Chart URL')}
                helpText={t(
                  'OCI or HTTP/HTTPS .tar file for the Helm Chart; for example, oci://registry.example.com/charts/mychart or https://example.com/chart-1.0.0.tgz.',
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
                label={t('Release name')}
                helpText={t('Unique name for Helm release.')}
                required
                data-test="oci-release-name"
              />
            </GridItem>
            <GridItem md={6}>
              <InputField
                type={TextInputTypes.text}
                name="chartVersion"
                label={t('Chart version')}
                helpText={t('The version of chart to install.')}
                placeholder="1.0.0"
                required
                data-test="oci-chart-version"
              />
            </GridItem>
            <GridItem md={12}>
              <ResourceDropdownField
                name="basicAuthSecretName"
                label={t('Secret for Basic authentication')}
                resources={secretResources}
                dataSelector={['metadata', 'name']}
                fullWidth
                placeholder={t('Select a secret')}
                showBadge
                autocompleteFilter={autocompleteFilter}
                helpText={t(
                  'A secret with "username" and "password" keys for OCI/HTTP(S) authentication',
                )}
              />
            </GridItem>
          </Grid>
        </FormSection>
      </FormBody>
      <FormFooter
        handleReset={handleReset}
        errorMessage={status?.submitError}
        isSubmitting={isSubmitting}
        submitLabel={t('Next')}
        disableSubmit={isNextDisabled}
        resetLabel={t('Cancel')}
        sticky
      />
    </FlexForm>
  );
};

export default HelmURLChartForm;
