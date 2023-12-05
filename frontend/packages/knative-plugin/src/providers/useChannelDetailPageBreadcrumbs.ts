import { useTranslation } from 'react-i18next';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { K8sKind } from '@console/internal/module/k8s';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { serverlessTab } from '../utils/serverless-tab-utils';

export const useChannelDetailPageBreadcrumbs = (kindObj: K8sKind) => {
  const { t } = useTranslation();
  const params = useParams();
  const location = useLocation();
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  return useTabbedTableBreadcrumbsFor(
    kindObj,
    location,
    params,
    'eventing',
    serverlessTab('Channel'),
    isAdminPerspective ? t('knative-plugin~Channels') : undefined,
    isAdminPerspective,
  );
};
