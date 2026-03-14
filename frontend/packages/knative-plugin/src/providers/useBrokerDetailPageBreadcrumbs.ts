import { useParams, useLocation } from 'react-router';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import type { K8sKind } from '@console/internal/module/k8s';
import { useTabbedTableBreadcrumbsFor } from '@console/shared/src/hooks/useTabbedTableBreadcrumb';
import { EventingBrokerModel } from '../models';
import { serverlessTab } from '../utils/serverless-tab-utils';

export const useBrokerDetailPageBreadcrumbs = (kindObj: K8sKind) => {
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  const params = useParams();
  const location = useLocation();
  return useTabbedTableBreadcrumbsFor(
    kindObj,
    location,
    params,
    'eventing',
    serverlessTab(kindObj.kind),
    undefined,
    isAdminPerspective,
  );
};

export const getBrokerModel = () => EventingBrokerModel;
