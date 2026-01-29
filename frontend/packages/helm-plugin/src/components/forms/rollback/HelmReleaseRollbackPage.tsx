import type { FC } from 'react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { Formik } from 'formik';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { getQueryArgument } from '@console/internal/components/utils';
import { DocumentTitle } from '@console/shared/src/components/document-title/DocumentTitle';
import type { HelmRelease, HelmActionOrigins } from '../../../types/helm-types';
import { HelmActionType } from '../../../types/helm-types';
import { fetchHelmReleaseHistory, getHelmActionConfig } from '../../../utils/helm-utils';
import HelmReleaseRollbackForm from './HelmReleaseRollbackForm';

type HelmRollbackFormData = {
  revision: number;
};

const HelmReleaseRollbackPage: FC = () => {
  const navigate = useNavigate();
  const handleCancel = useCallback(() => navigate(-1), [navigate]);
  const { t } = useTranslation();
  const { releaseName, ns: namespace } = useParams();
  const actionOrigin = getQueryArgument('actionOrigin') as HelmActionOrigins;
  const [releaseHistory, setReleaseHistory] = useState<HelmRelease[]>(null);

  const config = useMemo(
    () => getHelmActionConfig(HelmActionType.Rollback, releaseName, namespace, t, actionOrigin),
    [actionOrigin, namespace, releaseName, t],
  );

  useEffect(() => {
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
      <Formik initialValues={initialValues} onSubmit={handleSubmit} onReset={handleCancel}>
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
