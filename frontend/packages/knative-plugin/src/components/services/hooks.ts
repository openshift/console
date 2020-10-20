import { match as RMatch } from 'react-router-dom';
import { K8sKind } from '@console/internal/module/k8s';
import { useTabbedTableBreadcrumbsFor } from '@console/shared';
import { servingTab } from '../../utils/serverless-tab-utils';

type Match = RMatch<{ url: string }>;

export const useServingBreadcrumbsFor = (kindObj: K8sKind, match: Match) =>
  useTabbedTableBreadcrumbsFor(kindObj, match, 'serving', servingTab(kindObj));
