import * as React from 'react';
import * as _ from 'lodash';
import * as Ajv from 'ajv';
import { JSONSchema6 } from 'json-schema';
import { safeDump, safeLoad } from 'js-yaml';
import { Formik } from 'formik';
import { Helmet } from 'react-helmet';
import { RouteComponentProps } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { history, LoadingBox } from '@console/internal/components/utils';
import { coFetchJSON } from '@console/internal/co-fetch';
import { SecretModel } from '@console/internal/models';
import { k8sGet } from '@console/internal/module/k8s';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';

import {
  HelmActionType,
  HelmChart,
  HelmRelease,
  HelmActionConfigType,
  HelmActionOrigins,
} from '../../../types/helm-types';
import { getHelmActionValidationSchema } from '../../../utils/helm-validation-utils';
import { getHelmActionConfig, getChartValuesYAML, getChartReadme } from '../../../utils/helm-utils';
import HelmInstallUpgradeForm from './HelmInstallUpgradeForm';
import HelmChartMetaDescription from './HelmChartMetaDescription';

export type HelmInstallUpgradePageProps = RouteComponentProps<{
  ns?: string;
  releaseName?: string;
}>;

export type HelmInstallUpgradeFormData = {
  releaseName: string;
  chartURL?: string;
  chartName: string;
  chartRepoName: string;
  chartVersion: string;
  chartReadme: string;
  appVersion: string;
  yamlData: string;
  formData: any;
  formSchema: JSONSchema6;
  editorType: EditorType;
};

const HelmInstallUpgradePage: React.FunctionComponent<HelmInstallUpgradePageProps> = ({
  location,
  match,
}) => {
  const searchParams = new URLSearchParams(location.search);

  const namespace = match.params.ns || searchParams.get('preselected-ns');
  const initialChartURL = decodeURIComponent(searchParams.get('chartURL'));
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
  const [initialFormSchema, setInitialFormSchema] = React.useState<JSONSchema6>();

  const helmAction: HelmActionType =
    initialChartURL !== 'null' ? HelmActionType.Install : HelmActionType.Upgrade;

  const config = React.useMemo<HelmActionConfigType>(
    () =>
      getHelmActionConfig(
        helmAction,
        initialReleaseName,
        namespace,
        t,
        helmActionOrigin,
        initialChartURL,
      ),
    [helmAction, helmActionOrigin, initialChartURL, initialReleaseName, namespace, t],
  );

  React.useEffect(() => {
    let ignore = false;

    const fetchHelmRelease = async () => {
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

    fetchHelmRelease();

    return () => {
      ignore = true;
    };
  }, [config.helmReleaseApi, helmAction]);

  const initialValues: HelmInstallUpgradeFormData = {
    releaseName: initialReleaseName || helmChartName || '',
    chartURL: initialChartURL,
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
      yamlData,
      formData,
      formSchema,
      editorType,
    }: HelmInstallUpgradeFormData = values;
    let valuesObj;

    if (editorType === EditorType.Form) {
      const ajv = new Ajv();
      const validSchema = ajv.validateSchema(formSchema);
      const validFormData = validSchema && ajv.validate(formSchema, formData);
      if (validFormData) {
        valuesObj = formData;
      } else {
        actions.setStatus({
          submitError: t('helm-plugin~Errors in the form - {{errorsText}}', {
            errorsText: ajv.errorsText(),
          }),
        });
        return Promise.reject();
      }
    } else if (yamlData) {
      try {
        valuesObj = safeLoad(yamlData);
      } catch (err) {
        actions.setStatus({ submitError: t('helm-plugin~Invalid YAML - {{err}}', { err }) });
        return Promise.reject();
      }
    }

    const payload = {
      namespace,
      name: releaseName,
      ...(chartURL !== 'null' || undefined ? { chart_url: chartURL } : {}), // eslint-disable-line @typescript-eslint/camelcase
      ...(valuesObj ? { values: valuesObj } : {}),
    };

    const isGoingToTopology =
      helmAction === HelmActionType.Install || helmActionOrigin === HelmActionOrigins.topology;

    return config
      .fetch('/api/helm/release', payload, null, -1)
      .then(async (res: HelmRelease) => {
        let redirect = config.redirectURL;

        if (isGoingToTopology && res?.info?.notes) {
          const options = {
            queryParams: { labelSelector: `name=${res.name},version=${res.version},owner=helm` },
          };
          let secret;
          try {
            secret = await k8sGet(SecretModel, null, res.namespace, options);
          } catch (err) {
            console.error(err); // eslint-disable-line no-console
          }
          const secretId = secret?.items?.[0]?.metadata?.uid;
          if (secretId) {
            redirect = `${config.redirectURL}?selectId=${secretId}&selectTab=Release+Notes`;
          }
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
          />
        )}
      </Formik>
    </NamespacedPage>
  );
};

export default HelmInstallUpgradePage;
