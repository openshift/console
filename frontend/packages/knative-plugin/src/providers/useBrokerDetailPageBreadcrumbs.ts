import { match } from 'react-router';
import { useTabbedTableBreadcrumbsFor } from '@console/dynamic-plugin-sdk';
import { K8sKind } from '@console/internal/module/k8s';
import { EventingBrokerModel } from '../models';
import { serverlessTab } from '../utils/serverless-tab-utils';

export const useBrokerDetailPageBreadcrumbs = (kindObj: K8sKind, urlMatch: match<any>) =>
  useTabbedTableBreadcrumbsFor(kindObj, urlMatch, 'eventing', serverlessTab(kindObj.kind));

export const getBrokerModel = () => EventingBrokerModel;
