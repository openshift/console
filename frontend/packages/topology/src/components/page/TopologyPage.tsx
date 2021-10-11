import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { Helmet } from 'react-helmet';
import { useTranslation, Trans } from 'react-i18next';
import { match as RMatch } from 'react-router-dom';
import NamespacedPage, {
  NamespacedPageVariants,
} from '@console/dev-console/src/components/NamespacedPage';
import CreateProjectListPage from '@console/dev-console/src/components/projects/CreateProjectListPage';
import { ErrorBoundaryFallback } from '@console/internal/components/error';
import { withStartGuide } from '@console/internal/components/start-guide';
import { removeQueryArgument, setQueryArgument } from '@console/internal/components/utils';
import { useQueryParams, useUserSettingsCompatibility } from '@console/shared/src';
import { withFallback } from '@console/shared/src/components/error/error-boundary';
import {
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
  match: RMatch<{
    name?: string;
  }>;
  activeViewStorageKey?: string;
  hideProjects?: boolean;
  defaultViewType?: TopologyViewType;
}

type PageContentsProps = {
  match: RMatch<{
    name?: string;
  }>;
  viewType: TopologyViewType;
};

const PageContents: React.FC<PageContentsProps> = ({ match, viewType }) => {
  const { t } = useTranslation();
  const namespace = match.params.name;

  return namespace ? (
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
  );
};

const PageContentsWithStartGuide = withStartGuide(PageContents);

export const TopologyPage: React.FC<TopologyPageProps> = ({
  match,
  activeViewStorageKey = LAST_TOPOLOGY_VIEW_LOCAL_STORAGE_KEY,
  hideProjects = false,
  defaultViewType = TopologyViewType.graph,
}) => {
  const { t } = useTranslation();
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

  const namespace = match.params.name;
  const queryParams = useQueryParams();
  const viewType =
    (queryParams.get('view') as TopologyViewType) || topologyViewState || defaultViewType;

  React.useEffect(() => {
    if (!queryParams.get('view')) {
      setQueryArgument('view', topologyViewState || defaultViewType);
    }
  }, [defaultViewType, topologyViewState, queryParams]);

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
        <Helmet>
          <title>{t('topology~Topology')}</title>
        </Helmet>
        <NamespacedPage
          variant={namespacedPageVariant}
          onNamespaceChange={handleNamespaceChange}
          hideProjects={hideProjects}
          toolbar={<TopologyPageToolbar viewType={viewType} onViewChange={onViewChange} />}
          data-test-id={
            viewType === TopologyViewType.graph ? 'topology-graph-page' : 'topology-list-page'
          }
        >
          <PageContentsWithStartGuide match={match} viewType={viewType} />
        </NamespacedPage>
      </DataModelProvider>
    </FilterProvider>
  );
};

export default withFallback(TopologyPage, ErrorBoundaryFallback);
