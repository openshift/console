import * as React from 'react';
import { Formik } from 'formik';
import { safeDump, safeLoad } from 'js-yaml';
import { JSONSchema7 } from 'json-schema';
import * as _ from 'lodash';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router-dom';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { coFetchJSON } from '@console/internal/co-fetch';
import { history, LoadingBox } from '@console/internal/components/utils';
import { prune } from '@console/shared/src/components/dynamic-form/utils';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
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

export type HelmInstallUpgradePageProps = RouteComponentProps<{
  ns?: string;
  releaseName?: string;
}>;

const HelmInstallUpgradePage: React.FunctionComponent<HelmInstallUpgradePageProps> = ({
  location,
  match,
}) => {
  const searchParams = new URLSearchParams(location.search);

  const namespace = match.params.ns || searchParams.get('preselected-ns');
  const initialChartURL = searchParams.get('chartURL');
  const indexEntry = searchParams.get('indexEntry');
  const initialReleaseName = match.params.releaseName || '';
  const helmChartName = searchParams.get('chartName');
  const helmChartRepoName = searchParams.get('chartRepoName');
  const helmActionOrigin = searchParams.get('actionOrigin') as HelmActionOrigins;

  const { t } = useTranslation();
  const [chartData, setChartData] = React.useState<HelmChart>(null);
  const [chartName, setChartName] = React.useState<string>('');
  const [chartVersion, setChartVersion] = React.useState<string>('');
  const [appVersion, setAppVersion] = React.useState<string>('');
  const [chartReadme, setChartReadme] = React.useState<string>('');
  const [chartHasValues, setChartHasValues] = React.useState<boolean>(false);
  const [chartError, setChartError] = React.useState<Error>(null);

  const [initialYamlData, setInitialYamlData] = React.useState<string>('');
  const [initialFormData, setInitialFormData] = React.useState<object>();
  const [initialFormSchema, setInitialFormSchema] = React.useState<JSONSchema7>();
  const helmAction: HelmActionType = initialChartURL
    ? HelmActionType.Create
    : HelmActionType.Upgrade;

  const config = React.useMemo<HelmActionConfigType>(
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

  React.useEffect(() => {
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

        history.push(redirect);
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  if (!chartData && !chartError) {
    return <LoadingBox />;
  }

  const chartMetaDescription = <HelmChartMetaDescription chart={chartData} />;

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} disabled hideApplications>
      <Helmet>
        <title>{config.title}</title>
      </Helmet>
      <Formik
        initialValues={initialValues}
        onSubmit={handleSubmit}
        onReset={history.goBack}
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
          />
        )}
      </Formik>
    </NamespacedPage>
  );
};

export default HelmInstallUpgradePage;
