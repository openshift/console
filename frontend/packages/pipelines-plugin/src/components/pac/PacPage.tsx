import * as React from 'react';
import { Helmet } from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { useLocation, match as Rmatch } from 'react-router-dom';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { useAccessReview } from '@console/dynamic-plugin-sdk';
import { ErrorPage404 } from '@console/internal/components/error';
import { LoadingBox, AccessDenied, history } from '@console/internal/components/utils';
import { useFlag } from '@console/shared/src';
import { FLAG_OPENSHIFT_PIPELINE } from '../../const';
import { PIPELINE_NAMESPACE } from '../pipelines/const';
import { usePacData } from './hooks';
import PacForm from './PacForm';
import PacOverview from './PacOverview';

type PacPageProps = {
  match: Rmatch<any>;
};

const PacPage: React.FC<PacPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const isPipelinesEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE);
  const [isAdmin, isAdminCheckLoading] = useAccessReview({
    namespace: PIPELINE_NAMESPACE,
    verb: 'create',
    resource: 'secrets',
  });
  const code = queryParams.get('code');
  const {
    params: { ns: namespace },
  } = match;

  React.useEffect(() => {
    if (isPipelinesEnabled && namespace !== PIPELINE_NAMESPACE) {
      history.push(`/pac/ns/${PIPELINE_NAMESPACE}`);
    }
  }, [isPipelinesEnabled, namespace]);

  const { loaded, secretData, loadError } = usePacData(code);

  if (!isPipelinesEnabled) {
    return <ErrorPage404 />;
  }

  if (!isAdminCheckLoading && !isAdmin) {
    return <AccessDenied />;
  }

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light} hideApplications>
      <Helmet>
        <title>{t('pipelines-plugin~Configure Pipelines as Code')}</title>
      </Helmet>
      {!loaded ? (
        <LoadingBox />
      ) : loadError || secretData ? (
        <PacOverview namespace={namespace} secret={secretData} loadError={loadError} />
      ) : (
        <PacForm namespace={namespace} />
      )}
    </NamespacedPage>
  );
};

export default PacPage;
