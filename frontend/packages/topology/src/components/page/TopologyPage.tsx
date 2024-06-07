import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage, {
  CreateAProjectButton,
} from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { withStartGuide } from '@console/internal/components/start-guide';
import {
  getQueryArgument,
  removeQueryArgument,
  setQueryArgument,
} from '@console/internal/components/utils';
import { useQueryParams, useUserSettingsCompatibility } from '@console/shared';
import { ErrorBoundaryFallbackPage, withFallback } from '@console/shared/src/components/error';
import {
  LAST_TOPOLOGY_OVERVIEW_OPEN_STORAGE_KEY,
  LAST_TOPOLOGY_VIEW_LOCAL_STORAGE_KEY,
  TOPOLOGY_VIEW_CONFIG_STORAGE_KEY,
} from '../../const';
import DataModelProvider from '../../data-transforms/DataModelProvider';
import { TOPOLOGY_SEARCH_FILTER_KEY } from '../../filters';
import { FilterProvider } from '../../filters/FilterProvider';
import { TopologyViewType } from '../../topology-types';
import { usePreferredTopologyView } from '../../user-preferences/usePreferredTopologyView';
import TopologyDataRenderer from './TopologyDataRenderer';
import TopologyPageToolbar from './TopologyPageToolbar';

interface TopologyPageProps {
  activeViewStorageKey?: string;
  hideProjects?: boolean;
  defaultViewType?: TopologyViewType;
}

type PageContentsProps = {
  viewType: TopologyViewType;
};

const PageContents: React.FC<PageContentsProps> = ({ viewType }) => {
  const { t } = useTranslation();
  const { name: namespace } = useParams();

  return namespace ? (
    <TopologyDataRenderer viewType={viewType} />
  ) : (
    <CreateProjectListPage title={t('topology~Topology')}>
      {(openProjectModal) => (
        <Trans t={t} ns="topology">
          Select a Project to view the topology
          <CreateAProjectButton openProjectModal={openProjectModal} />.
        </Trans>
      )}
    </CreateProjectListPage>
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

export const TopologyPage: React.FC<TopologyPageProps> = ({
  activeViewStorageKey = LAST_TOPOLOGY_VIEW_LOCAL_STORAGE_KEY,
  hideProjects = false,
  defaultViewType = TopologyViewType.graph,
}) => {
  const [preferredTopologyView, preferredTopologyViewLoaded] = usePreferredTopologyView();
  const [
    topologyLastView,
    setTopologyLastView,
    isTopologyLastViewLoaded,
  ] = useUserSettingsCompatibility<TopologyViewType>(
    TOPOLOGY_VIEW_CONFIG_STORAGE_KEY,
    activeViewStorageKey,
    defaultViewType,
  );
  const params = useParams();

  const loaded: boolean = preferredTopologyViewLoaded && isTopologyLastViewLoaded;

  const topologyViewState = React.useMemo((): TopologyViewType => {
    if (!loaded) {
      return null;
    }

    if (preferredTopologyView === 'latest') {
      return topologyLastView;
    }

    return (preferredTopologyView || topologyLastView) as TopologyViewType;
  }, [loaded, preferredTopologyView, topologyLastView]);

  const namespace = params.name;
  const queryParams = useQueryParams();
  const viewType =
    (queryParams.get('view') as TopologyViewType) || topologyViewState || defaultViewType;

  React.useEffect(() => {
    const lastOverviewOpen = JSON.parse(
      sessionStorage.getItem(LAST_TOPOLOGY_OVERVIEW_OPEN_STORAGE_KEY) ?? '{}',
    );
    if (loaded && namespace in lastOverviewOpen && !getQueryArgument('selectId')) {
      setQueryArgument('selectId', lastOverviewOpen[namespace]);
    }
  }, [loaded, namespace]);

  React.useEffect(() => {
    if (!queryParams.get('view') && loaded) {
      setQueryArgument('view', topologyViewState || defaultViewType);
    }
  }, [defaultViewType, topologyViewState, queryParams, loaded]);

  const onViewChange = React.useCallback(
    (newViewType: TopologyViewType) => {
      setQueryArgument('view', newViewType);
      setTopologyLastView(newViewType);
    },
    [setTopologyLastView],
  );

  const handleNamespaceChange = (ns: string) => {
    if (ns !== namespace) {
      removeQueryArgument(TOPOLOGY_SEARCH_FILTER_KEY);
    }
  };

  const namespacedPageVariant = namespace
    ? viewType === TopologyViewType.graph
      ? NamespacedPageVariants.default
      : NamespacedPageVariants.light
    : NamespacedPageVariants.light;

  return (
    <FilterProvider>
      <DataModelProvider namespace={namespace}>
        <NamespacedPage
          variant={namespacedPageVariant}
          onNamespaceChange={handleNamespaceChange}
          hideProjects={hideProjects}
          toolbar={<TopologyPageToolbar viewType={viewType} onViewChange={onViewChange} />}
          data-test-id={
            viewType === TopologyViewType.graph ? 'topology-graph-page' : 'topology-list-page'
          }
        >
          <PageContentsWithStartGuide viewType={viewType} />
        </NamespacedPage>
      </DataModelProvider>
    </FilterProvider>
  );
};

export default withFallback(TopologyPage, ErrorBoundaryFallbackPage);
