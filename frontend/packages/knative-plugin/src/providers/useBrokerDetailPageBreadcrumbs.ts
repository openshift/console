import { match } from 'react-router';
import { K8sKind } from '@console/internal/module/k8s';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { serverlessTab } from '../utils/serverless-tab-utils';
import { EventingBrokerModel } from '../models';

export const useBrokerDetailPageBreadcrumbs = (kindObj: K8sKind, urlMatch: match<any>) =>
  useTabbedTableBreadcrumbsFor(kindObj, urlMatch, 'eventing', serverlessTab(kindObj.kind));

export const getBrokerModel = () => EventingBrokerModel;
