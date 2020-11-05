import * as React from 'react';
import Helmet from 'react-helmet';
import { Formik } from 'formik';
import { RouteComponentProps } from 'react-router';
import { useTranslation } from 'react-i18next';
import { PageBody } from '@console/shared';
import { coFetchJSON } from '@console/internal/co-fetch';
import { history, getQueryArgument } from '@console/internal/components/utils';

import { HelmRelease, HelmActionType, HelmActionOrigins } from './helm-types';
import { getHelmActionConfig } from './helm-utils';
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
  const { t } = useTranslation();
  const { releaseName, ns: namespace } = match.params;
  const actionOrigin = getQueryArgument('actionOrigin') as HelmActionOrigins;
  const [releaseHistory, setReleaseHistory] = React.useState<HelmRelease[]>(null);

  const config = React.useMemo(
    () => getHelmActionConfig(HelmActionType.Rollback, releaseName, namespace, t, actionOrigin),
    [actionOrigin, namespace, releaseName, t],
  );

  React.useEffect(() => {
    let ignore = false;

    const fetchReleaseHistory = async () => {
      let res: HelmRelease[];
      try {
        res = await coFetchJSON(config.helmReleaseApi);
      } catch {} // eslint-disable-line no-empty
      if (ignore) return;

      res?.length > 0 && setReleaseHistory(res);
    };

    fetchReleaseHistory();

    return () => {
      ignore = true;
    };
  }, [config.helmReleaseApi]);

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

    config
      .fetch('/api/helm/release', payload, null, -1)
      .then(() => {
        actions.setStatus({ isSubmitting: false });
        history.push(config.redirectURL);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
      });
  };

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} disabled hideApplications>
      <Helmet>
        <title>{config.title}</title>
      </Helmet>
      <PageBody>
        <Formik initialValues={initialValues} onSubmit={handleSubmit} onReset={history.goBack}>
          {(props) => (
            <HelmReleaseRollbackForm
              {...props}
              releaseName={releaseName}
              releaseHistory={releaseHistory}
              helmActionConfig={config}
            />
          )}
        </Formik>
      </PageBody>
    </NamespacedPage>
  );
};

export default HelmReleaseRollbackPage;
