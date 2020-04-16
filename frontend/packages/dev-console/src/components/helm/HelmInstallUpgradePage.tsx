import * as React from 'react';
import * as _ from 'lodash';
import { safeDump, safeLoad } from 'js-yaml';
import { Formik } from 'formik';
import { Helmet } from 'react-helmet';
import { RouteComponentProps } from 'react-router-dom';
import { PageHeading, history, LoadingBox } from '@console/internal/components/utils';
import { coFetchJSON } from '@console/internal/co-fetch';
import { PageBody } from '@console/shared';
import { SecretModel } from '@console/internal/models';
import { k8sGet } from '@console/internal/module/k8s';

import { HelmActionType, HelmChart, HelmRelease, HelmActionConfigType } from './helm-types';
import { getHelmActionValidationSchema } from './helm-validation-utils';
import { getHelmActionConfig, getChartValuesYAML } from './helm-utils';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import HelmInstallUpgradeForm from './form/HelmInstallUpgradeForm';

export type HelmInstallUpgradePageProps = RouteComponentProps<{
  ns?: string;
  releaseName?: string;
}>;

export type HelmInstallUpgradeFormData = {
  helmReleaseName: string;
  helmChartURL?: string;
  chartName?: string;
  chartValuesYAML: string;
  chartVersion?: string;
};

const HelmInstallUpgradePage: React.FunctionComponent<HelmInstallUpgradePageProps> = ({
  location,
  match,
}) => {
  const searchParams = new URLSearchParams(location.search);

  const chartURL = decodeURIComponent(searchParams.get('chartURL'));
  const namespace = match.params.ns || searchParams.get('preselected-ns');
  const releaseName = match.params.releaseName || '';
  const helmChartName = searchParams.get('chartName');
  const [chartDataLoaded, setChartDataLoaded] = React.useState<boolean>(false);
  const [chartName, setChartName] = React.useState<string>('');
  const [chartHasValues, setChartHasValues] = React.useState<boolean>(false);
  const [YAMLData, setYAMLData] = React.useState<string>('');
  const [activeChartVersion, setActiveChartVersion] = React.useState<string>('');
  const helmAction: HelmActionType =
    chartURL !== 'null' ? HelmActionType.Install : HelmActionType.Upgrade;

  const config = React.useMemo<HelmActionConfigType>(
    () => getHelmActionConfig(helmAction, releaseName, namespace, chartURL),
    [chartURL, helmAction, namespace, releaseName],
  );

  React.useEffect(() => {
    let ignore = false;

    const fetchHelmRelease = async () => {
      let res;
      try {
        res = await coFetchJSON(config.helmReleaseApi);
      } catch {} // eslint-disable-line no-empty
      if (ignore) return;

      if (helmAction === HelmActionType.Install) {
        const chartValues = getChartValuesYAML(res);
        setYAMLData(chartValues);
        setChartHasValues(!!chartValues);
      } else {
        const chart: HelmChart = res?.chart;
        const releaseValues = !_.isEmpty(res?.config) ? safeDump(res?.config) : '';
        const chartValues = getChartValuesYAML(chart);
        const values = releaseValues || chartValues;
        setYAMLData(values);
        setChartHasValues(!!values);
        setChartName(chart.metadata.name);
        setActiveChartVersion(chart.metadata.version);
      }
      setChartDataLoaded(true);
    };

    fetchHelmRelease();

    return () => {
      ignore = true;
    };
  }, [config.helmReleaseApi, helmAction]);

  const initialValues: HelmInstallUpgradeFormData = {
    helmReleaseName: releaseName || helmChartName || '',
    helmChartURL: chartURL,
    chartName,
    chartValuesYAML: YAMLData,
    chartVersion: activeChartVersion,
  };

  const handleSubmit = (values, actions) => {
    actions.setStatus({ isSubmitting: true });
    const { helmReleaseName, helmChartURL, chartValuesYAML }: HelmInstallUpgradeFormData = values;
    let valuesObj;
    if (chartValuesYAML) {
      try {
        valuesObj = safeLoad(chartValuesYAML);
      } catch (err) {
        actions.setStatus({ submitError: `Invalid YAML - ${err}` });
        return;
      }
    }

    const payload = {
      namespace,
      name: helmReleaseName,
      ...(helmChartURL !== 'null' || undefined
        ? // eslint-disable-next-line @typescript-eslint/camelcase
          { chart_url: helmChartURL }
        : {}),
      ...(valuesObj ? { values: valuesObj } : {}),
    };

    config
      .fetch('/api/helm/release', payload)
      .then(async (res: HelmRelease) => {
        let redirect = config.redirectURL;

        if (helmAction === HelmActionType.Install && res?.info?.notes) {
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

  if (!chartDataLoaded) {
    return <LoadingBox />;
  }

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} disabled hideApplications>
      <Helmet>
        <title>{config.title}</title>
      </Helmet>
      <PageHeading title={config.title}>{chartHasValues && config.subTitle}</PageHeading>
      <PageBody flexLayout>
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onReset={history.goBack}
          validationSchema={getHelmActionValidationSchema(helmAction)}
        >
          {(props) => (
            <HelmInstallUpgradeForm
              {...props}
              chartHasValues={chartHasValues}
              submitLabel={helmAction}
            />
          )}
        </Formik>
      </PageBody>
    </NamespacedPage>
  );
};

export default HelmInstallUpgradePage;
