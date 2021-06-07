import * as React from 'react';
import { Helmet } from 'react-helmet';
import { matchPath, match as RMatch } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { useQueryParams, useUserSettingsCompatibility } from '@console/shared/src';
import { Button } from '@patternfly/react-core';
import { removeQueryArgument, setQueryArgument } from '@console/internal/components/utils';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import ProjectsExistWrapper from '@console/dev-console/src/components/ProjectsExistWrapper';
import CreateProjectListPage from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import { ErrorBoundaryFallback } from '@console/internal/components/error';
import TopologyDataRenderer from './TopologyDataRenderer';
import {
  LAST_TOPOLOGY_VIEW_LOCAL_STORAGE_KEY,
  TOPOLOGY_VIEW_CONFIG_STORAGE_KEY,
} from '../../const';
import { TOPOLOGY_SEARCH_FILTER_KEY } from '../../filters';
import DataModelProvider from '../../data-transforms/DataModelProvider';
import TopologyPageToolbar from './TopologyPageToolbar';
import { TopologyViewType } from '../../topology-types';

interface TopologyPageProps {
  match: RMatch<{
    name?: string;
  }>;
  activeViewStorageKey?: string;
  hideProjects?: boolean;
  defaultViewType?: TopologyViewType;
}

const TopologyPage: React.FC<TopologyPageProps> = ({
  match,
  activeViewStorageKey = LAST_TOPOLOGY_VIEW_LOCAL_STORAGE_KEY,
  hideProjects = false,
  defaultViewType = TopologyViewType.graph,
}) => {
  const { t } = useTranslation();
  const [
    topologyViewState,
    setTopologyViewState,
    isTopologyViewStateLoaded,
  ] = useUserSettingsCompatibility<TopologyViewType>(
    TOPOLOGY_VIEW_CONFIG_STORAGE_KEY,
    activeViewStorageKey,
    defaultViewType,
  );
  const namespace = match.params.name;
  const queryParams = useQueryParams();
  let viewType = queryParams.get('view') as TopologyViewType;
  const { projects } = useK8sWatchResources<{ [key: string]: K8sResourceKind[] }>({
    projects: { kind: 'Project', isList: true },
  });
  if (!viewType) {
    // Backwards Compatibility, check path. Otherwise use any stored preference
    viewType = matchPath(match.path, {
      path: '*/list',
      exact: true,
    })
      ? TopologyViewType.list
      : matchPath(match.path, {
          path: '*/graph',
          exact: true,
        })
      ? TopologyViewType.graph
      : isTopologyViewStateLoaded && ((topologyViewState as TopologyViewType) || defaultViewType);
    viewType && setQueryArgument('view', viewType);
  }

  const onViewChange = React.useCallback(
    (newViewType: TopologyViewType) => {
      setQueryArgument('view', newViewType);
      setTopologyViewState(newViewType);
    },
    [setTopologyViewState],
  );

  const handleNamespaceChange = (ns: string) => {
    if (ns !== namespace) {
      removeQueryArgument(TOPOLOGY_SEARCH_FILTER_KEY);
    }
  };

  return (
    <DataModelProvider namespace={namespace}>
      <Helmet>
        <title>{t('topology~Topology')}</title>
      </Helmet>
      <NamespacedPage
        variant={
          viewType === TopologyViewType.graph
            ? NamespacedPageVariants.default
            : NamespacedPageVariants.light
        }
        onNamespaceChange={handleNamespaceChange}
        hideProjects={hideProjects}
        toolbar={<TopologyPageToolbar viewType={viewType} onViewChange={onViewChange} />}
        data-test-id={
          viewType === TopologyViewType.graph ? 'topology-graph-page' : 'topology-list-page'
        }
      >
        <ProjectsExistWrapper title={t('topology~Topology')} projects={projects}>
          {namespace ? (
            <TopologyDataRenderer viewType={viewType} />
          ) : (
            <CreateProjectListPage title={t('topology~Topology')}>
              {(openProjectModal) => (
                <Trans t={t} ns="topology">
                  Select a Project to view the topology or{' '}
                  <Button isInline variant="link" onClick={openProjectModal}>
                    create a Project
                  </Button>
                  .
                </Trans>
              )}
            </CreateProjectListPage>
          )}
        </ProjectsExistWrapper>
      </NamespacedPage>
    </DataModelProvider>
  );
};

export default withFallback(TopologyPage, ErrorBoundaryFallback);
