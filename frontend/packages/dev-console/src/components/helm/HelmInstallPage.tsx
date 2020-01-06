import * as React from 'react';
import * as yup from 'yup';
import { RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { PageHeading, history } from '@console/internal/components/utils';
import { coFetchJSON } from '@console/internal/co-fetch';
import { Formik } from 'formik';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import { nameValidationSchema } from '../import/validation-schema';
import HelmInstallForm from './HelmInstallForm';

export type HelmInstallPageProps = RouteComponentProps<{ ns?: string }>;

export type HelmInstallFormData = {
  releaseName: string;
};

export const HelmInstallPage: React.FunctionComponent<HelmInstallPageProps> = ({ location }) => {
  const searchParams = new URLSearchParams(location.search);
  const chartURL = encodeURIComponent(searchParams.get('chartURL'));
  const preselectedNamespace = searchParams.get('preselected-ns');

  const initialValues: HelmInstallFormData = {
    releaseName: '',
  };

  const validationSchema = yup.object().shape({
    releaseName: nameValidationSchema,
  });

  const handleSubmit = (values, actions) => {
    const { releaseName }: HelmInstallFormData = values;
    coFetchJSON
      .post(
        `/api/console/helm/install?ns=${preselectedNamespace}&name=${releaseName}&url=${chartURL}`,
        null,
        null,
      )
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
          render={(props) => <HelmInstallForm {...props} />}
        />
      </div>
    </NamespacedPage>
  );
};

export default HelmInstallPage;
