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
import HelmInstallUpgradeForm from './HelmInstallUpgradeForm';
import { HelmActionType, HelmChart, HelmActionConfigType } from './helm-types';
import { getValidationSchema } from './helm-validation-utils';

export type HelmInstallUpgradePageProps = RouteComponentProps<{
  ns?: string;
  releaseName?: string;
}>;

export type HelmInstallUpgradeFormData = {
  helmReleaseName: string;
  helmChartURL?: string;
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
  const [chartDataLoaded, setChartDataLoaded] = React.useState(false);
  const [chartName, setChartName] = React.useState('');
  const [chartHasValues, setChartHasValues] = React.useState(false);
  const [YAMLData, setYAMLData] = React.useState({});
  const [activeChartVersion, setActiveChartVersion] = React.useState<string>('');
  const helmAction: HelmActionType =
    chartURL !== 'null' ? HelmActionType.Install : HelmActionType.Upgrade;

  const HelmActionConfig: { [helmAction: string]: HelmActionConfigType } = {
    [HelmActionType.Install]: {
      title: 'Install Helm Chart',
      helmReleaseApi: `/api/helm/chart?url=${chartURL}`,
      fetch: coFetchJSON.post,
      redirectURL: `/topology/ns/${namespace}`,
    },
    [HelmActionType.Upgrade]: {
      title: 'Upgrade Helm Release',
      helmReleaseApi: `/api/helm/release?ns=${namespace}&release_name=${releaseName}`,
      fetch: coFetchJSON.put,
      redirectURL: `/helm-releases/ns/${namespace}`,
    },
  };

  React.useEffect(() => {
    let ignore = false;

    const fetchHelmRelease = async () => {
      let res;
      try {
        res = await coFetchJSON(HelmActionConfig[helmAction].helmReleaseApi);
      } catch {
        if (ignore) return;
      }
      if (ignore) return;
      const data: HelmChart = !_.isEmpty(res.chart) ? res.chart : res;
      setYAMLData(!_.isEmpty(res.config) ? _.merge(data.values, res.config) : data.values);
      if (helmAction === HelmActionType.Upgrade) {
        setChartName(data.metadata.name);
        setActiveChartVersion(data.metadata.version);
      }
      setChartDataLoaded(true);
      !_.isEmpty(data.values) && setChartHasValues(true);
    };

    fetchHelmRelease();

    return () => {
      ignore = true;
    };
  }, [helmAction, HelmActionConfig]);

  const initialValues: HelmInstallUpgradeFormData = {
    helmReleaseName: releaseName || helmChartName || '',
    helmChartURL: chartURL,
    chartValuesYAML: !_.isEmpty(YAMLData) ? safeDump(YAMLData) : undefined,
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

    HelmActionConfig[helmAction]
      .fetch('/api/helm/release', payload)
      .then(() => {
        actions.setSubmitting(false);
        history.push(HelmActionConfig[helmAction].redirectURL);
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
        <title>{HelmActionConfig[helmAction].title}</title>
      </Helmet>
      <PageHeading title={HelmActionConfig[helmAction].title}>
        {helmAction === HelmActionType.Install &&
          chartHasValues &&
          'The helm chart will be installed using the YAML shown in the editor below.'}
      </PageHeading>
      <PageBody flexLayout>
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onReset={history.goBack}
          validationSchema={getValidationSchema(helmAction)}
        >
          {(props) => (
            <HelmInstallUpgradeForm
              {...props}
              chartHasValues={chartHasValues}
              activeChartVersion={activeChartVersion}
              chartName={chartName}
              submitLabel={helmAction}
            />
          )}
        </Formik>
      </PageBody>
    </NamespacedPage>
  );
};

export default HelmInstallUpgradePage;
