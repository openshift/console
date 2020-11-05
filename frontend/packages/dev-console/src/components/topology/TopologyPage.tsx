import * as React from 'react';
import { Helmet } from 'react-helmet';
import { matchPath, match as RMatch } from 'react-router-dom';
import { useQueryParams } from '@console/shared/src';
import { removeQueryArgument, setQueryArgument } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import ProjectsExistWrapper from '../ProjectsExistWrapper';
import CreateProjectListPage from '../projects/CreateProjectListPage';
import { TopologyDataRenderer } from './TopologyDataRenderer';
import { LAST_TOPOLOGY_VIEW_LOCAL_STORAGE_KEY } from './components';
import { TOPOLOGY_SEARCH_FILTER_KEY } from './filters';
import DataModelProvider from './data-transforms/DataModelProvider';
import { TopologyPageToolbar } from './TopologyPageToolbar';

import './TopologyPage.scss';
import { K8sResourceKind } from '@console/internal/module/k8s';

export interface TopologyPageProps {
  match: RMatch<{
    name?: string;
  }>;
  activeViewStorageKey?: string;
  title?: string;
  hideProjects?: boolean;
}

const setTopologyActiveView = (key: string, id: string) => {
  localStorage.setItem(key, id);
};

const getTopologyActiveView = (key: string) => {
  return localStorage.getItem(key);
};

export const TopologyPage: React.FC<TopologyPageProps> = ({
  match,
  activeViewStorageKey = LAST_TOPOLOGY_VIEW_LOCAL_STORAGE_KEY,
  title = 'Topology',
  hideProjects = false,
}) => {
  const namespace = match.params.name;
  const queryParams = useQueryParams();
  let view = queryParams.get('view');
  const { projects } = useK8sWatchResources<{ [key: string]: K8sResourceKind[] }>({
    projects: { kind: 'Project', isList: true },
  });

  // Backwards Compatibility
  const urlView = matchPath(match.path, {
    path: '*/list',
    exact: true,
  })
    ? 'list'
    : matchPath(match.path, {
        path: '*/graph',
        exact: true,
      })
    ? 'graph'
    : null;

  if (urlView && !view) {
    setQueryArgument('view', urlView);
    view = urlView;
  }

  if (!view) {
    view = getTopologyActiveView(activeViewStorageKey);
    setQueryArgument('view', view);
  }

  const showGraphView = view === 'graph';

  const onViewChange = React.useCallback(
    (graphView: boolean) => {
      const viewId = graphView ? 'graph' : 'list';
      setQueryArgument('view', viewId);
      setTopologyActiveView(activeViewStorageKey, viewId);
    },
    [activeViewStorageKey],
  );

  const handleNamespaceChange = (ns: string) => {
    if (ns !== namespace) {
      removeQueryArgument(TOPOLOGY_SEARCH_FILTER_KEY);
    }
  };

  return (
    <DataModelProvider namespace={namespace}>
      <Helmet>
        <title>Topology</title>
      </Helmet>
      <NamespacedPage
        variant={showGraphView ? NamespacedPageVariants.default : NamespacedPageVariants.light}
        onNamespaceChange={handleNamespaceChange}
        hideProjects={hideProjects}
        toolbar={<TopologyPageToolbar showGraphView={showGraphView} onViewChange={onViewChange} />}
        data-test-id={showGraphView ? 'topology-graph-page' : 'topology-list-page'}
      >
        <ProjectsExistWrapper title="Topology" projects={projects}>
          {namespace ? (
            <TopologyDataRenderer showGraphView={showGraphView} title={title} />
          ) : (
            <CreateProjectListPage title="Topology">
              Select a project to view the topology
            </CreateProjectListPage>
          )}
        </ProjectsExistWrapper>
      </NamespacedPage>
    </DataModelProvider>
  );
};

export default TopologyPage;
