import * as React from 'react';
// import { useTranslation } from 'react-i18next';
import { useLocation, match as Rmatch, useHistory } from 'react-router-dom';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import { useAccessReview } from '@console/dynamic-plugin-sdk';
import { ErrorPage404 } from '@console/internal/components/error';
import { LoadingBox, AccessDenied } from '@console/internal/components/utils';
import { useFlag } from '@console/shared/src';
import { FLAG_OPENSHIFT_PIPELINE } from '../../const';
import { PIPELINE_NAMESPACE } from '../pipelines/const';
import { usePacData } from './hooks/usePacData';
import PacForm from './PacForm';
import PacOverview from './PacOverview';

type PacPageProps = {
  match: Rmatch<{
    ns?: string;
  }>;
};

const PacPage: React.FC<PacPageProps> = ({ match }) => {
  // const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
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
  }, [history, isPipelinesEnabled, namespace]);

  const { loaded, secretData, loadError, isFirstSetup } = usePacData(code);

  if (!isPipelinesEnabled) {
    return <ErrorPage404 />;
  }

  if (!isAdminCheckLoading && !isAdmin) {
    return <AccessDenied />;
  }

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light} hideApplications>
      {!loaded ? (
        <LoadingBox />
      ) : loadError || secretData ? (
        <PacOverview
          namespace={namespace}
          secret={secretData}
          loadError={loadError}
          showSuccessAlert={isFirstSetup}
        />
      ) : (
        <PacForm namespace={namespace} />
      )}
    </NamespacedPage>
  );
};

export default PacPage;
