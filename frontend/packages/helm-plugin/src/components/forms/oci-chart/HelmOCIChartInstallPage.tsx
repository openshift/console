import type { FunctionComponent } from 'react';
import { useState, useMemo, useCallback } from 'react';
import { Formik, FormikHelpers } from 'formik';
import { safeLoad } from 'js-yaml';
import { JSONSchema7 } from 'json-schema';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src';
import { coFetchJSON } from '@console/internal/co-fetch';
import { history, LoadingBox } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared/src';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { prune } from '@console/shared/src/components/dynamic-form/utils';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { HelmChart, HelmRelease } from '../../../types/helm-types';
import {
  getChartValuesYAML,
  getChartReadme,
  fetchHelmRelease,
  loadHelmManifestResources,
  isGoingToTopology,
} from '../../../utils/helm-utils';
import HelmChartMetaDescription from '../install-upgrade/HelmChartMetaDescription';
import { getHelmOCIValidationSchema } from './helm-oci-validation-utils';
import HelmOCIChartForm from './HelmOCIChartForm';
import HelmOCIInstallForm from './HelmOCIInstallForm';
import { HelmOCIChartFormData, HelmOCIInstallFormData, WizardStep } from './types';

const HelmOCIChartInstallPage: FunctionComponent = () => {
  const params = useParams();
  const { t } = useTranslation();
  const [activePerspective] = useActivePerspective();
  const namespace = params.ns;

  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.ChartDetails);
  const [chartData, setChartData] = useState<HelmChart | null>(null);
  const [chartHasValues, setChartHasValues] = useState<boolean>(false);
  const [chartError, setChartError] = useState<Error | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);

  const [initialYamlData, setInitialYamlData] = useState<string>('');
  const [initialFormData, setInitialFormData] = useState<object>();
  const [initialFormSchema, setInitialFormSchema] = useState<JSONSchema7>();

  // Store chart details from step 1
  const [chartDetails, setChartDetails] = useState<HelmOCIChartFormData | null>(null);

  const initialChartFormValues: HelmOCIChartFormData = {
    releaseName: '',
    chartURL: '',
    chartVersion: '',
    namespace,
  };

  const fetchChartData = useCallback(async (chartURL: string, chartVersion: string) => {
    setIsLoadingChart(true);
    setChartError(null);

    try {
      // For OCI charts, version is appended as a tag (e.g., oci://registry/chart:1.0.0)
      const fullChartURL = chartVersion ? `${chartURL}:${chartVersion}` : chartURL;
      const apiUrl = `/api/helm/oci-chart-get?url=${encodeURIComponent(fullChartURL)}`;

      const res = await coFetchJSON(apiUrl);
      const chart: HelmChart = res?.chart || res;
      const chartValues = getChartValuesYAML(chart);
      const valuesYAML = chartValues;
      const valuesJSON = chart?.values ?? {};
      const valuesSchema = chart?.schema && JSON.parse(atob(chart?.schema));

      setInitialYamlData(valuesYAML);
      setInitialFormData(valuesJSON);
      setInitialFormSchema(valuesSchema);
      setChartHasValues(!!valuesYAML);
      setChartData(chart);
    } catch (e) {
      setChartError(e as Error);
    } finally {
      setIsLoadingChart(false);
    }
  }, []);

  const handleNextStep = useCallback(
    (values: HelmOCIChartFormData) => {
      setChartDetails(values);
      fetchChartData(values.chartURL, values.chartVersion);
      setCurrentStep(WizardStep.ConfigureInstall);
    },
    [fetchChartData],
  );

  const handleBackStep = useCallback(() => {
    setCurrentStep(WizardStep.ChartDetails);
    setChartData(null);
    setChartError(null);
  }, []);

  const handleSubmit = async (
    values: HelmOCIInstallFormData,
    actions: FormikHelpers<HelmOCIInstallFormData>,
  ) => {
    const { releaseName, chartURL, chartVersion, yamlData, formData, editorType } = values;

    let valuesObj;
    if (editorType === EditorType.Form) {
      try {
        const prunedFormData = prune(formData);
        if (prunedFormData) {
          valuesObj = prunedFormData;
        } else {
          actions.setStatus({
            submitError: t('helm-plugin~Errors in the form data.'),
          });
          return;
        }
      } catch (err) {
        actions.setStatus({
          submitError: t('helm-plugin~Invalid Form Schema - {{errorText}}', {
            errorText: err.toString(),
          }),
        });
        return;
      }
    } else if (yamlData) {
      try {
        valuesObj = safeLoad(yamlData);
      } catch (err) {
        actions.setStatus({
          submitError: t('helm-plugin~Invalid YAML - {{errorText}}', { errorText: err.toString() }),
        });
        return;
      }
    }

    // For OCI charts, version is appended as a tag (e.g., oci://registry/chart:1.0.0)
    const fullChartURL = chartVersion ? `${chartURL}:${chartVersion}` : chartURL;

    const payload = {
      namespace,
      name: releaseName,
      chart_url: fullChartURL, // eslint-disable-line @typescript-eslint/naming-convention
      ...(valuesObj ? { values: valuesObj } : {}),
    };

    try {
      const res = await coFetchJSON.post('/api/helm/oci-chart', payload);

      let redirect = `/topology/ns/${namespace}`;
      let helmRelease: HelmRelease;
      try {
        helmRelease = await fetchHelmRelease(namespace, releaseName);
      } catch (err) {
        console.error('Could not fetch the helm release', err); // eslint-disable-line no-console
      }

      const resources = loadHelmManifestResources(helmRelease);
      if (isGoingToTopology(resources)) {
        const secretId = res?.metadata?.uid;
        redirect = helmRelease?.info?.notes
          ? `${redirect}?selectId=${secretId}&selectTab=${t('helm-plugin~Release notes')}`
          : redirect;
      } else {
        redirect = `/helm-releases/ns/${namespace}/release/${releaseName}`;
      }

      history.push(redirect);
    } catch (err) {
      actions.setStatus({ submitError: err.message });
    }
  };

  const handleNamespaceChange = (ns: string) => {
    if (ns === ALL_NAMESPACES_KEY) {
      history.push(`/helm/all-namespaces`);
    } else if (ns !== namespace) {
      history.push(`/helm/ns/${ns}/oci-chart`);
    }
  };

  const installFormValues: HelmOCIInstallFormData = useMemo(
    () => ({
      releaseName: chartDetails?.releaseName || '',
      chartURL: chartDetails?.chartURL || '',
      chartVersion: chartDetails?.chartVersion || '',
      namespace,
      chartName: chartData?.metadata?.name || '',
      appVersion: chartData?.metadata?.appVersion || '',
      chartReadme: getChartReadme(chartData),
      yamlData: initialYamlData,
      formData: initialFormData,
      formSchema: initialFormSchema,
      editorType: initialFormSchema ? EditorType.Form : EditorType.YAML,
    }),
    [chartDetails, namespace, chartData, initialYamlData, initialFormData, initialFormSchema],
  );

  const chartMetaDescription = chartData ? <HelmChartMetaDescription chart={chartData} /> : null;

  const pageTitle = t('helm-plugin~Install Helm Chart from OCI Registry');

  return (
    <NamespacedPage
      variant={NamespacedPageVariants.light}
      disabled={activePerspective === 'dev'}
      onNamespaceChange={handleNamespaceChange}
      hideApplications
    >
      <DocumentTitle>{pageTitle}</DocumentTitle>
      {currentStep === WizardStep.ChartDetails && (
        <Formik
          initialValues={chartDetails || initialChartFormValues}
          onSubmit={(values) => handleNextStep(values)}
          onReset={history.goBack}
          validationSchema={getHelmOCIValidationSchema(t)}
          enableReinitialize
        >
          {(formikProps) => (
            <HelmOCIChartForm
              {...formikProps}
              namespace={namespace}
              onNext={() => handleNextStep(formikProps.values)}
            />
          )}
        </Formik>
      )}
      {currentStep === WizardStep.ConfigureInstall && (
        <>
          {isLoadingChart ? (
            <LoadingBox />
          ) : (
            <Formik
              initialValues={installFormValues}
              onSubmit={handleSubmit}
              onReset={handleBackStep}
              enableReinitialize
            >
              {(formikProps) => (
                <HelmOCIInstallForm
                  {...formikProps}
                  chartHasValues={chartHasValues}
                  chartMetaDescription={chartMetaDescription}
                  chartError={chartError}
                  namespace={namespace}
                  onBack={handleBackStep}
                />
              )}
            </Formik>
          )}
        </>
      )}
    </NamespacedPage>
  );
};

export default HelmOCIChartInstallPage;
