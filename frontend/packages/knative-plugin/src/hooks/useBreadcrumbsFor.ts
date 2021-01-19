import { match as RMatch } from 'react-router-dom';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { K8sKind } from '@console/internal/module/k8s';
import { serverlessTab } from '../utils/serverless-tab-utils';

type Match = RMatch<{ url: string }>;

export const useServerlessBreadcrumbsFor = (
  kindObj: K8sKind,
  match: Match,
  navName: string,
  customTab?: string,
) =>
  useTabbedTableBreadcrumbsFor(kindObj, match, navName, serverlessTab(customTab || kindObj.kind));
