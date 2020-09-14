import { match as RMatch } from 'react-router-dom';
// FIXME upgrading redux types is causing many errors at this time
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore
import { useSelector } from 'react-redux';
import { getBreadcrumbPath } from '@console/internal/components/utils/breadcrumbs';
import { K8sKind } from '@console/internal/module/k8s';
import { RootState } from '@console/internal/redux';
import { getActivePerspective, getActiveNamespace } from '@console/internal/reducers/ui';
import { ALL_NAMESPACES_KEY } from '@console/shared';
import { pipelinesTab } from '../../utils/pipeline-utils';

type Match = RMatch<{ url: string }>;

const useTabbedTableBreadcrumbsFor = (kindObj: K8sKind, match: Match, navOption: string) => {
  const currentNamespace = useSelector((state: RootState) => getActiveNamespace(state));
  const isAdminPerspective =
    useSelector((state: RootState) => getActivePerspective(state)) === 'admin';
  const nsURL =
    ALL_NAMESPACES_KEY === currentNamespace ? 'all-namespaces' : `ns/${currentNamespace}`;
  const subTab = pipelinesTab(kindObj);

  if (subTab == null) {
    return [];
  }

  return [
    {
      name: kindObj.labelPlural,
      path: isAdminPerspective ? `/${navOption}/${nsURL}/${subTab}` : getBreadcrumbPath(match),
    },
    { name: `${kindObj.label} Details`, path: match.url },
  ];
};

export const usePipelinesBreadcrumbsFor = (kindObj: K8sKind, match: Match) =>
  useTabbedTableBreadcrumbsFor(kindObj, match, 'pipelines');

export const useTasksBreadcrumbsFor = (kindObj: K8sKind, match: Match) =>
  useTabbedTableBreadcrumbsFor(kindObj, match, 'tasks');

export const useTriggersBreadcrumbsFor = (kindObj: K8sKind, match: Match) =>
  useTabbedTableBreadcrumbsFor(kindObj, match, 'triggers');
