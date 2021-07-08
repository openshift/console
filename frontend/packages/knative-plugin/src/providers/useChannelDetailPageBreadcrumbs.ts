import { useTranslation } from 'react-i18next';
import { match } from 'react-router';
import { K8sKind } from '@console/internal/module/k8s';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { useActivePerspective } from '@console/shared/src/hooks/useActivePerspective';
import { serverlessTab } from '../utils/serverless-tab-utils';

export const useChannelDetailPageBreadcrumbs = (kindObj: K8sKind, urlMatch: match<any>) => {
  const { t } = useTranslation();
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  return useTabbedTableBreadcrumbsFor(
    kindObj,
    urlMatch,
    'eventing',
    serverlessTab('Channel'),
    isAdminPerspective ? t('knative-plugin~Channels') : undefined,
  );
};
