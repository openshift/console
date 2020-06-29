import * as React from 'react';
import * as _ from 'lodash';
import * as Ajv from 'ajv';
import { JSONSchema6 } from 'json-schema';
import { safeDump, safeLoad } from 'js-yaml';
import { Formik } from 'formik';
import { Helmet } from 'react-helmet';
import { RouteComponentProps } from 'react-router-dom';
import { history, LoadingBox } from '@console/internal/components/utils';
import { coFetchJSON } from '@console/internal/co-fetch';
import { PageBody } from '@console/shared';
import { SecretModel } from '@console/internal/models';
import { k8sGet } from '@console/internal/module/k8s';

import {
  HelmActionType,
  HelmChart,
  HelmRelease,
  HelmActionConfigType,
  HelmActionOrigins,
} from './helm-types';
import { getHelmActionValidationSchema } from './helm-validation-utils';
import { getHelmActionConfig, getChartValuesYAML, getChartReadme } from './helm-utils';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import HelmInstallUpgradeForm from './form/HelmInstallUpgradeForm';
import HelmChartMetaDescription from './form/HelmChartMetaDescription';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';

export type HelmInstallUpgradePageProps = RouteComponentProps<{
  ns?: string;
  releaseName?: string;
}>;

export type HelmInstallUpgradeFormData = {
  releaseName: string;
  chartURL?: string;
  chartName: string;
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
  const helmActionOrigin = searchParams.get('actionOrigin') as HelmActionOrigins;

  const [chartData, setChartData] = React.useState<HelmChart>(null);
  const [chartName, setChartName] = React.useState<string>('');
  const [chartVersion, setChartVersion] = React.useState<string>('');
  const [appVersion, setAppVersion] = React.useState<string>('');
  const [chartReadme, setChartReadme] = React.useState<string>('');
  const [chartHasValues, setChartHasValues] = React.useState<boolean>(false);

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
        helmActionOrigin,
        initialChartURL,
      ),
    [helmAction, helmActionOrigin, initialChartURL, initialReleaseName, namespace],
  );

  React.useEffect(() => {
    let ignore = false;

    const fetchHelmRelease = async () => {
      let res;
      try {
        res = await coFetchJSON(config.helmReleaseApi);
      } catch {} // eslint-disable-line no-empty
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
      setChartName(chart.metadata.name);
      setChartVersion(chart.metadata.version);
      setAppVersion(chart.metadata.appVersion);
      setChartReadme(getChartReadme(chart));
      setChartHasValues(!!valuesYAML);
      setChartData(chart);
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
    appVersion,
    chartVersion,
    chartReadme,
    yamlData: initialYamlData,
    formData: initialFormData,
    formSchema: initialFormSchema,
    editorType: initialFormSchema ? EditorType.Form : EditorType.YAML,
  };

  const handleSubmit = (values, actions) => {
    actions.setStatus({ isSubmitting: true });
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
        actions.setStatus({ submitError: `Errors in the Form - ${ajv.errorsText()}` });
        return;
      }
    } else if (yamlData) {
      try {
        valuesObj = safeLoad(yamlData);
      } catch (err) {
        actions.setStatus({ submitError: `Invalid YAML - ${err}` });
        return;
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

    config
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

        actions.setStatus({ isSubmitting: false });
        history.push(redirect);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message, isSubmitting: false });
      });
  };

  if (!chartData) {
    return <LoadingBox />;
  }

  const chartMetaDescription = <HelmChartMetaDescription chart={chartData} />;

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} disabled hideApplications>
      <Helmet>
        <title>{config.title}</title>
      </Helmet>
      <PageBody flexLayout>
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onReset={history.goBack}
          validationSchema={getHelmActionValidationSchema(helmAction)}
        >
          {(formikProps) => (
            <HelmInstallUpgradeForm
              {...formikProps}
              chartHasValues={chartHasValues}
              chartMetaDescription={chartMetaDescription}
              helmActionConfig={config}
              onVersionChange={setChartData}
            />
          )}
        </Formik>
      </PageBody>
    </NamespacedPage>
  );
};

export default HelmInstallUpgradePage;
