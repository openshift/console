import * as React from 'react';
import * as yup from 'yup';
import { safeDump, safeLoad } from 'js-yaml';
import { RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { PageHeading, history } from '@console/internal/components/utils';
import { coFetchJSON } from '@console/internal/co-fetch';
import { Formik } from 'formik';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import { nameValidationSchema } from '../import/validation-schema';
import HelmInstallForm from './HelmInstallForm';
import { mockValues } from './helm-release-resources-utils';

export type HelmInstallPageProps = RouteComponentProps<{ ns?: string }>;

export type HelmInstallFormData = {
  releaseName: string;
  valuesYAML: string;
};

export const HelmInstallPage: React.FunctionComponent<HelmInstallPageProps> = ({ location }) => {
  const searchParams = new URLSearchParams(location.search);
  const chartURL = decodeURIComponent(searchParams.get('chartURL'));
  const preselectedNamespace = searchParams.get('preselected-ns');

  const initialValues: HelmInstallFormData = {
    releaseName: '',
    valuesYAML: safeDump(mockValues),
  };

  const validationSchema = yup.object().shape({
    releaseName: nameValidationSchema,
  });

  const handleSubmit = (values, actions) => {
    const { releaseName, valuesYAML }: HelmInstallFormData = values;
    let valuesObj;

    try {
      valuesObj = safeLoad(valuesYAML);
    } catch (err) {
      actions.setStatus({ submitError: `Invalid YAML - ${err}` });
      return;
    }

    const payload = {
      namespace: preselectedNamespace,
      name: releaseName,
      // eslint-disable-next-line @typescript-eslint/camelcase
      chart_url: chartURL,
      ...(valuesObj ? { values: valuesObj } : {}),
    };

    coFetchJSON
      .post('/api/helm/release', payload, null)
      .then(() => {
        actions.setSubmitting(false);
        history.push(`/topology/ns/${preselectedNamespace}`);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
      });
  };

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>Install Helm Chart</title>
      </Helmet>
      <PageHeading title="Install Helm Chart" />
      <div className="co-m-pane__body">
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onReset={history.goBack}
          validationSchema={validationSchema}
        >
          {(props) => <HelmInstallForm {...props} />}
        </Formik>
      </div>
    </NamespacedPage>
  );
};

export default HelmInstallPage;
