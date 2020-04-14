import * as React from 'react';
import * as _ from 'lodash';
import { safeDump, safeLoad } from 'js-yaml';
import { Formik } from 'formik';
import { Helmet } from 'react-helmet';
import { RouteComponentProps } from 'react-router-dom';
import { PageHeading, history, LoadingBox } from '@console/internal/components/utils';
import { coFetchJSON } from '@console/internal/co-fetch';
import { PageBody } from '@console/shared';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import HelmInstallUpgradeForm from './form/HelmInstallUpgradeForm';
import { HelmActionType, HelmChart, HelmActionConfigType } from './helm-types';
import { getHelmActionValidationSchema } from './helm-validation-utils';
import { getHelmActionConfig, getChartValuesYAML } from './helm-utils';

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
  const releaseName = !_.isEmpty(match.params.releaseName) && match.params.releaseName;
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
      .then(() => {
        actions.setSubmitting(false);
        history.push(config.redirectURL);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
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
