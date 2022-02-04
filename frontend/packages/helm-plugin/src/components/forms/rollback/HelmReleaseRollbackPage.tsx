import * as React from 'react';
import { Formik } from 'formik';
import Helmet from 'react-helmet';
import { RouteComponentProps } from 'react-router';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { history, getQueryArgument } from '@console/internal/components/utils';
import { HelmRelease, HelmActionType, HelmActionOrigins } from '../../../types/helm-types';
import { fetchHelmReleaseHistory, getHelmActionConfig } from '../../../utils/helm-utils';
import HelmReleaseRollbackForm from './HelmReleaseRollbackForm';

type HelmReleaseRollbackPageProps = RouteComponentProps<{
  ns?: string;
  releaseName?: string;
}>;

type HelmRollbackFormData = {
  revision: number;
};

const HelmReleaseRollbackPage: React.FC<HelmReleaseRollbackPageProps> = ({ match }) => {
  const { releaseName, ns: namespace } = match.params;
  const actionOrigin = getQueryArgument('actionOrigin') as HelmActionOrigins;
  const [releaseHistory, setReleaseHistory] = React.useState<HelmRelease[]>(null);

  const config = React.useMemo(
    () => getHelmActionConfig(HelmActionType.Rollback, releaseName, namespace, actionOrigin),
    [actionOrigin, namespace, releaseName],
  );

  React.useEffect(() => {
    let ignore = false;

    const getReleaseHistory = async () => {
      let res: HelmRelease[];
      try {
        res = await fetchHelmReleaseHistory(releaseName, namespace);
      } catch {} // eslint-disable-line no-empty
      if (ignore) return;

      res?.length > 0 && setReleaseHistory(res);
    };

    getReleaseHistory();

    return () => {
      ignore = true;
    };
  }, [namespace, releaseName]);

  const initialValues: HelmRollbackFormData = {
    revision: -1,
  };

  const handleSubmit = (values, actions) => {
    const payload = {
      namespace,
      name: releaseName,
      version: values.revision,
    };

    return config
      .fetch('/api/helm/release', payload, null, -1)
      .then(() => {
        history.push(config.redirectURL);
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} disabled hideApplications>
      <Helmet>
        <title>{config.title}</title>
      </Helmet>
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
    </NamespacedPage>
  );
};

export default HelmReleaseRollbackPage;
