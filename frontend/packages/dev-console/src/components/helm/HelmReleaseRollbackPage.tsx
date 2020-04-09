import * as React from 'react';
import Helmet from 'react-helmet';
import { Formik } from 'formik';
import { RouteComponentProps } from 'react-router';
import { PageBody } from '@console/shared';
import { coFetchJSON } from '@console/internal/co-fetch';
import { PageHeading, history } from '@console/internal/components/utils';

import { HelmRelease } from './helm-types';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import HelmReleaseRollbackForm from './form/HelmReleaseRollbackForm';

type HelmReleaseRollbackPageProps = RouteComponentProps<{
  ns?: string;
  releaseName?: string;
}>;

type HelmRollbackFormData = {
  revision: number;
};

const HelmReleaseRollbackPage: React.FC<HelmReleaseRollbackPageProps> = ({ match }) => {
  const { releaseName, ns: namespace } = match.params;
  const [releaseHistory, setReleaseHistory] = React.useState<HelmRelease[]>(null);

  React.useEffect(() => {
    let ignore = false;

    const fetchReleaseHistory = async () => {
      let res: HelmRelease[];
      try {
        res = await coFetchJSON(`/api/helm/release/history?ns=${namespace}&name=${releaseName}`);
      } catch {} // eslint-disable-line no-empty
      if (ignore) return;

      res?.length > 0 && setReleaseHistory(res);
    };

    fetchReleaseHistory();

    return () => {
      ignore = true;
    };
  }, [namespace, releaseName]);

  const initialValues: HelmRollbackFormData = {
    revision: -1,
  };

  const handleSubmit = (values, actions) => {
    actions.setStatus({ isSubmitting: true });
    const payload = {
      namespace,
      name: releaseName,
      version: values.revision,
    };

    coFetchJSON
      .put('/api/helm/release', payload)
      .then(() => {
        actions.setStatus({ isSubmitting: false });
        history.push(`/helm-releases/ns/${namespace}`);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
      });
  };

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} disabled hideApplications>
      <Helmet>
        <title>Rollback Helm Release</title>
      </Helmet>
      <PageHeading title="Rollback Helm Release">
        Select the version to rollback <strong>{releaseName}</strong> to, from the table below:
      </PageHeading>
      <PageBody>
        <Formik initialValues={initialValues} onSubmit={handleSubmit} onReset={history.goBack}>
          {(props) => <HelmReleaseRollbackForm {...props} releaseHistory={releaseHistory} />}
        </Formik>
      </PageBody>
    </NamespacedPage>
  );
};

export default HelmReleaseRollbackPage;
