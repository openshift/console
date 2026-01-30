import type { FunctionComponent } from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Formik } from 'formik';
import { safeDump, safeLoad } from 'js-yaml';
import { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams, useLocation, useNavigate } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { useActivePerspective } from '@console/dynamic-plugin-sdk/src';
import { coFetchJSON } from '@console/internal/co-fetch';
import { LoadingBox } from '@console/internal/components/utils';
import { ALL_NAMESPACES_KEY } from '@console/shared/src';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { prune } from '@console/shared/src/components/dynamic-form/utils';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { CHART_NAME_ANNOTATION, PROVIDER_NAME_ANNOTATION } from '../../../catalog/utils/const';
import {
  HelmActionType,
  HelmChart,
  HelmRelease,
  HelmActionConfigType,
  HelmActionOrigins,
} from '../../../types/helm-types';
import {
  getHelmActionConfig,
  getChartValuesYAML,
  getChartReadme,
  fetchHelmRelease,
  loadHelmManifestResources,
  isGoingToTopology,
} from '../../../utils/helm-utils';
import { getHelmActionValidationSchema } from '../../../utils/helm-validation-utils';
import HelmChartMetaDescription from './HelmChartMetaDescription';
import HelmInstallUpgradeForm, { HelmInstallUpgradeFormData } from './HelmInstallUpgradeForm';

const HelmInstallUpgradePage: FunctionComponent = () => {
  const navigate = useNavigate();
  const handleCancel = useCallback(() => navigate(-1), [navigate]);
  const location = useLocation();
  const params = useParams();
  const searchParams = new URLSearchParams(location.search);
  const [activePerspective] = useActivePerspective();

  const namespace = params.ns || searchParams.get('preselected-ns');
  const initialChartURL = searchParams.get('chartURL');
  const indexEntry = searchParams.get('indexEntry');
  const initialReleaseName = params.releaseName || '';
  const helmChartName = searchParams.get('chartName');
  const helmChartRepoName = searchParams.get('chartRepoName');
  const helmActionOrigin = searchParams.get('actionOrigin') as HelmActionOrigins;

  const { t } = useTranslation();
  const [chartData, setChartData] = useState<HelmChart>(null);
  const [chartName, setChartName] = useState<string>('');
  const [chartVersion, setChartVersion] = useState<string>('');
  const [appVersion, setAppVersion] = useState<string>('');
  const [chartReadme, setChartReadme] = useState<string>('');
  const [chartHasValues, setChartHasValues] = useState<boolean>(false);
  const [chartError, setChartError] = useState<Error>(null);

  const [initialYamlData, setInitialYamlData] = useState<string>('');
  const [initialFormData, setInitialFormData] = useState<object>();
  const [initialFormSchema, setInitialFormSchema] = useState<JSONSchema7>();
  const helmAction: HelmActionType = initialChartURL
    ? HelmActionType.Create
    : HelmActionType.Upgrade;

  const config = useMemo<HelmActionConfigType>(
    () =>
      getHelmActionConfig(
        helmAction,
        initialReleaseName,
        namespace,
        t,
        helmActionOrigin,
        initialChartURL,
        indexEntry,
      ),
    [helmAction, helmActionOrigin, indexEntry, initialChartURL, initialReleaseName, namespace, t],
  );

  useEffect(() => {
    let ignore = false;

    const fetchHelmChart = async () => {
      let res;
      let error: Error = null;
      try {
        res = await coFetchJSON(config.helmReleaseApi);
      } catch (e) {
        error = e;
      }
      if (ignore) return;
      const chart: HelmChart = res?.chart || res;
      const chartValues = getChartValuesYAML(chart);
      const releaseValues = !_.isEmpty(res?.config) ? safeDump(res?.config) : '';
      const valuesYAML = releaseValues || chartValues;
      const valuesJSON = (res?.config || chart?.values) ?? {};
      const valuesSchema = chart?.schema && JSON.parse(atob(chart?.schema));
      setInitialYamlData(valuesYAML);
      setInitialFormData(valuesJSON);
      setInitialFormSchema(valuesSchema);
      setChartName(chart?.metadata.name);
      setChartVersion(chart?.metadata.version);
      setAppVersion(chart?.metadata.appVersion);
      setChartReadme(getChartReadme(chart));
      setChartHasValues(!!valuesYAML);
      setChartData(chart);
      setChartError(error);
    };

    fetchHelmChart();

    return () => {
      ignore = true;
    };
  }, [config.helmReleaseApi, helmAction]);

  const initialValues: HelmInstallUpgradeFormData = {
    releaseName: initialReleaseName || helmChartName || '',
    chartURL: initialChartURL,
    chartIndexEntry: indexEntry,
    chartName,
    chartRepoName: helmChartRepoName || '',
    appVersion,
    chartVersion,
    chartReadme,
    yamlData: initialYamlData,
    formData: initialFormData,
    formSchema: initialFormSchema,
    editorType: initialFormSchema ? EditorType.Form : EditorType.YAML,
  };

  const handleSubmit = (values, actions) => {
    const {
      releaseName,
      chartURL,
      chartIndexEntry,
      yamlData,
      formData,
      editorType,
    }: HelmInstallUpgradeFormData = values;
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
          return Promise.resolve();
        }
      } catch (err) {
        actions.setStatus({
          submitError: t('helm-plugin~Invalid Form Schema - {{errorText}}', {
            errorText: err.toString(),
          }),
        });
        return Promise.resolve();
      }
    } else if (yamlData) {
      try {
        valuesObj = safeLoad(yamlData);
      } catch (err) {
        actions.setStatus({
          submitError: t('helm-plugin~Invalid YAML - {{errorText}}', { errorText: err.toString() }),
        });
        return Promise.resolve();
      }
    }

    const payload = {
      namespace,
      name: releaseName,
      ...(chartURL ? { chart_url: chartURL } : {}), // eslint-disable-line @typescript-eslint/naming-convention
      ...(indexEntry ? { indexEntry } : { indexEntry: chartIndexEntry }),
      ...(valuesObj ? { values: valuesObj } : {}),
    };

    return config
      .fetch('/api/helm/release/async', payload, null, -1)
      .then(async (res?: { metadata?: { uid?: string } }) => {
        let redirect = config.redirectURL;
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
            ? `${config.redirectURL}?selectId=${secretId}&selectTab=${t(
                'helm-plugin~Release notes',
              )}`
            : config.redirectURL;
        } else {
          redirect = `/helm-releases/ns/${namespace}/release/${releaseName}`;
        }

        navigate(redirect);
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  const handleNamespaceChange = (ns: string) => {
    if (ns === ALL_NAMESPACES_KEY) {
      navigate(`/helm/all-namespaces`);
    } else if (ns !== namespace) {
      navigate(`/helm/ns/${ns}`);
    }
  };

  if (!chartData && !chartError) {
    return <LoadingBox />;
  }
  const annotatedName = chartData?.metadata?.annotations?.[CHART_NAME_ANNOTATION] ?? '';
  const providerName = chartData?.metadata?.annotations?.[PROVIDER_NAME_ANNOTATION] ?? '';

  const chartMetaDescription = <HelmChartMetaDescription chart={chartData} />;

  return (
    <NamespacedPage
      variant={NamespacedPageVariants.light}
      disabled={activePerspective === 'dev'}
      onNamespaceChange={handleNamespaceChange}
      hideApplications
    >
      <DocumentTitle>{config.title}</DocumentTitle>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={handleCancel}
        validationSchema={getHelmActionValidationSchema(helmAction, t)}
      >
        {(formikProps) => (
          <HelmInstallUpgradeForm
            {...formikProps}
            chartHasValues={chartHasValues}
            chartMetaDescription={chartMetaDescription}
            helmActionConfig={config}
            onVersionChange={setChartData}
            chartError={chartError}
            namespace={namespace}
            chartIndexEntry={indexEntry}
            annotatedName={annotatedName}
            providerName={providerName}
          />
        )}
      </Formik>
    </NamespacedPage>
  );
};

export default HelmInstallUpgradePage;
