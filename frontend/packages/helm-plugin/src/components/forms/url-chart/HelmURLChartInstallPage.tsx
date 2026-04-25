import type { FunctionComponent } from 'react';
import { useState, useMemo, useCallback } from 'react';
import type { FormikHelpers } from 'formik';
import { Formik } from 'formik';
import { safeLoad } from 'js-yaml';
import type { JSONSchema7 } from 'json-schema';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src';
import { LoadingBox } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared/src';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { prune } from '@console/shared/src/components/dynamic-form/utils';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { coFetchJSON } from '@console/shared/src/utils/console-fetch';
import type { HelmChart, HelmRelease } from '../../../types/helm-types';
import {
  getChartValuesYAML,
  getChartReadme,
  fetchHelmRelease,
  loadHelmManifestResources,
  isGoingToTopology,
} from '../../../utils/helm-utils';
import HelmChartMetaDescription from '../install-upgrade/HelmChartMetaDescription';
import { getHelmChartURLValidationSchema } from './helm-oci-validation-utils';
import HelmURLChartForm from './HelmURLChartForm';
import HelmURLInstallForm from './HelmURLInstallForm';
import type { HelmURLChartFormData, HelmURLInstallFormData } from './types';
import { WizardStep } from './types';

// Only OCI refs use tag (chart:version); HTTP/HTTPS chart URLs (.tgz) must not have :version appended
const getFullChartURL = (chartURL: string, chartVersion: string): string => {
  if (!chartVersion) return chartURL;
  const isOCI = chartURL.startsWith('oci://');
  return isOCI ? `${chartURL}:${chartVersion}` : chartURL;
};

const HelmURLChartInstallPage: FunctionComponent = () => {
  const params = useParams();
  const { t } = useTranslation();
  const [activePerspective] = useActivePerspective();
  const navigate = useNavigate();
  const namespace = params.ns;

  const handleReset = useCallback(() => navigate(-1), [navigate]);

  const [currentStep, setCurrentStep] = useState<WizardStep>(WizardStep.ChartDetails);
  const [chartData, setChartData] = useState<HelmChart | null>(null);
  const [chartHasValues, setChartHasValues] = useState<boolean>(false);
  const [chartError, setChartError] = useState<Error | null>(null);
  const [isLoadingChart, setIsLoadingChart] = useState<boolean>(false);

  const [initialYamlData, setInitialYamlData] = useState<string>('');
  const [initialFormData, setInitialFormData] = useState<Record<string, unknown>>();
  const [initialFormSchema, setInitialFormSchema] = useState<JSONSchema7>();

  // Store chart details from step 1
  const [chartDetails, setChartDetails] = useState<HelmURLChartFormData | null>(null);

  const initialChartFormValues: HelmURLChartFormData = {
    releaseName: '',
    chartURL: '',
    chartVersion: '',
    namespace,
  };

  const fetchChartData = useCallback(async (chartURL: string, chartVersion: string) => {
    setIsLoadingChart(true);
    setChartError(null);

    try {
      const fullChartURL = getFullChartURL(chartURL, chartVersion);
      const apiUrl = `/api/helm/chart?url=${encodeURIComponent(fullChartURL)}&noRepo=true`;

      const res = await coFetchJSON(apiUrl);
      const chart: HelmChart = res?.chart || res;
      const valuesYAML = getChartValuesYAML(chart);
      const valuesJSON = chart?.values ?? {};
      const valuesSchema = chart?.schema && JSON.parse(atob(chart?.schema));

      setInitialYamlData(valuesYAML);
      setInitialFormData(valuesJSON as Record<string, unknown>);
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
    (values: HelmURLChartFormData) => {
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
    values: HelmURLInstallFormData,
    actions: FormikHelpers<HelmURLInstallFormData>,
  ) => {
    const { releaseName, chartURL, chartVersion, yamlData, formData, editorType } = values;

    let valuesObj: Record<string, unknown> | undefined;
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
        valuesObj = safeLoad(yamlData) as Record<string, unknown>;
      } catch (err) {
        actions.setStatus({
          submitError: t('helm-plugin~Invalid YAML - {{errorText}}', { errorText: err.toString() }),
        });
        return;
      }
    }

    const fullChartURL = getFullChartURL(chartURL, chartVersion);

    const payload = {
      namespace,
      name: releaseName,
      chart_url: fullChartURL, // eslint-disable-line @typescript-eslint/naming-convention
      ...(chartVersion ? { chart_version: chartVersion } : {}), // eslint-disable-line @typescript-eslint/naming-convention
      ...(valuesObj ? { values: valuesObj } : {}),
      noRepo: true,
    };

    try {
      const res = await coFetchJSON.post('/api/helm/release/async', payload);

      let redirect = `/topology/ns/${namespace}`;
      let helmRelease: HelmRelease | undefined;
      try {
        helmRelease = await fetchHelmRelease(namespace, releaseName);
      } catch (err) {
        console.error('Could not fetch Helm release.', err); // eslint-disable-line no-console
      }

      const resources = helmRelease ? loadHelmManifestResources(helmRelease) : [];
      if (helmRelease && isGoingToTopology(resources)) {
        const secretId = res?.metadata?.uid;
        redirect = helmRelease?.info?.notes
          ? `${redirect}?selectId=${secretId}&selectTab=${t('helm-plugin~Release notes')}`
          : redirect;
      } else {
        redirect = `/helm-releases/ns/${namespace}/release/${releaseName}`;
      }

      navigate(redirect);
    } catch (err) {
      actions.setStatus({ submitError: err.message });
    }
  };

  const handleNamespaceChange = (ns: string) => {
    if (ns === ALL_NAMESPACES_KEY) {
      navigate(`/helm/all-namespaces`);
    } else if (ns !== namespace) {
      navigate(`/helm/ns/${ns}/url-chart`);
    }
  };

  const installFormValues: HelmURLInstallFormData = useMemo(
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

  const pageTitle = t('helm-plugin~Install Helm chart from Helm registry.');

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
          onReset={handleReset}
          validationSchema={getHelmChartURLValidationSchema(t)}
          enableReinitialize
        >
          {(formikProps) => (
            <HelmURLChartForm
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
                <HelmURLInstallForm
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

export default HelmURLChartInstallPage;
