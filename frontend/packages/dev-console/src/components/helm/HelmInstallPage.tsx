import * as React from 'react';
import * as yup from 'yup';
import * as _ from 'lodash';
import { safeDump, safeLoad } from 'js-yaml';
import { RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { PageHeading, history, LoadingBox } from '@console/internal/components/utils';
import { coFetchJSON } from '@console/internal/co-fetch';
import { Formik } from 'formik';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import { nameValidationSchema } from '../import/validation-schema';
import HelmInstallForm from './HelmInstallForm';
import { HelmChart } from './helm-types';

export type HelmInstallPageProps = RouteComponentProps<{ ns?: string }>;

export type HelmInstallFormData = {
  releaseName: string;
  chartValuesYAML: string;
};

export const HelmInstallPage: React.FunctionComponent<HelmInstallPageProps> = ({ location }) => {
  const searchParams = new URLSearchParams(location.search);
  const chartURL = decodeURIComponent(searchParams.get('chartURL'));
  const chartName = searchParams.get('chartName');
  const preselectedNamespace = searchParams.get('preselected-ns');
  const [chartData, setChartData] = React.useState<HelmChart>();
  const [chartDataLoaded, setChartDataLoaded] = React.useState(false);
  const [chartHasValues, setChartHasValues] = React.useState(false);

  React.useEffect(() => {
    let ignore = false;

    const fetchHelmReleases = async () => {
      let res: HelmChart;
      try {
        res = await coFetchJSON(`/api/helm/chart?url=${chartURL}`);
      } catch {
        if (ignore) return;
      }
      if (ignore) return;

      setChartData(res);
      setChartDataLoaded(true);
      !_.isEmpty(res.values) && setChartHasValues(true);
    };

    fetchHelmReleases();

    return () => {
      ignore = true;
    };
  }, [chartURL]);

  const initialValues: HelmInstallFormData = {
    releaseName: chartName || '',
    chartValuesYAML: chartData ? safeDump(chartData.values) : undefined,
  };

  const validationSchema = yup.object().shape({
    releaseName: nameValidationSchema,
  });

  const handleSubmit = (values, actions) => {
    const { releaseName, chartValuesYAML }: HelmInstallFormData = values;
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
      namespace: preselectedNamespace,
      name: releaseName,
      // eslint-disable-next-line @typescript-eslint/camelcase
      chart_url: chartURL,
      ...(valuesObj ? { values: valuesObj } : {}),
    };

    coFetchJSON
      .post('/api/helm/release', payload, null, -1)
      .then(() => {
        actions.setSubmitting(false);
        history.push(`/topology/ns/${preselectedNamespace}`);
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
        <title>Install Helm Chart</title>
      </Helmet>
      <PageHeading title="Install Helm Chart">
        {chartHasValues &&
          'The helm chart will be installed using the YAML shown in the editor below.'}
      </PageHeading>
      <div className="co-m-pane__body" style={{ paddingBottom: 0 }}>
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onReset={history.goBack}
          validationSchema={validationSchema}
        >
          {(props) => <HelmInstallForm {...props} chartHasValues={chartHasValues} />}
        </Formik>
      </div>
    </NamespacedPage>
  );
};

export default HelmInstallPage;
