import * as React from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { getQueryArgument, history } from '@console/internal/components/utils';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import { HelmRelease, HelmActionType, HelmActionOrigins } from '../../../types/helm-types';
import { fetchHelmReleaseHistory, getHelmActionConfig } from '../../../utils/helm-utils';
import HelmReleaseRollbackForm from './HelmReleaseRollbackForm';

type HelmRollbackFormData = {
  revision: number;
};

const HelmReleaseRollbackPage: React.FC = () => {
  const { t } = useTranslation();
  const { releaseName, ns: namespace } = useParams();
  const actionOrigin = getQueryArgument('actionOrigin') as HelmActionOrigins;
  const [releaseHistory, setReleaseHistory] = React.useState<HelmRelease[]>(null);
  const navigate = useNavigate();

  const config = React.useMemo(
    () => getHelmActionConfig(HelmActionType.Rollback, releaseName, namespace, t, actionOrigin),
    [actionOrigin, namespace, releaseName, t],
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
        navigate(config.redirectURL);
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} disabled hideApplications>
      <DocumentTitle>{config.title}</DocumentTitle>
      <Formik initialValues={initialValues} onSubmit={handleSubmit} onReset={() => history.go(-1)}>
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
