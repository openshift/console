import { match } from 'react-router';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { K8sKind } from '@console/internal/module/k8s';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { EventingBrokerModel } from '../models';
import { serverlessTab } from '../utils/serverless-tab-utils';

export const useBrokerDetailPageBreadcrumbs = (kindObj: K8sKind, urlMatch: match<any>) => {
  const isAdminPerspective = useActivePerspective()[0] === 'admin';
  return useTabbedTableBreadcrumbsFor(
    kindObj,
    urlMatch,
    'eventing',
    serverlessTab(kindObj.kind),
    undefined,
    isAdminPerspective,
  );
};

export const getBrokerModel = () => EventingBrokerModel;
