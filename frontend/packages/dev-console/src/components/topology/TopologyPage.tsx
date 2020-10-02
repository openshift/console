import * as React from 'react';
import { Helmet } from 'react-helmet';
import { matchPath, match as RMatch, Link, Redirect } from 'react-router-dom';
import { Tooltip, Popover, Button } from '@patternfly/react-core';
import { ListIcon, TopologyIcon, QuestionCircleIcon } from '@patternfly/react-icons';
import { observer } from '@patternfly/react-topology';
import { useQueryParams } from '@console/shared/src';
import { Firehose, removeQueryArgument } from '@console/internal/components/utils';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import ProjectsExistWrapper from '../ProjectsExistWrapper';
import CreateProjectListPage from '../projects/CreateProjectListPage';
import { TopologyDataRenderer } from './TopologyDataRenderer';
import TopologyShortcuts from './TopologyShortcuts';
import { LAST_TOPOLOGY_VIEW_LOCAL_STORAGE_KEY } from './components/const';
import { TOPOLOGY_SEARCH_FILTER_KEY } from './filters';
import DataModelProvider from './data-transforms/DataModelProvider';
import ModelContext, { ExtensibleModel } from './data-transforms/ModelContext';

import './TopologyPage.scss';

export interface TopologyPageProps {
  match: RMatch<{
    name?: string;
  }>;
}

const setTopologyActiveView = (id: string) => {
  localStorage.setItem(LAST_TOPOLOGY_VIEW_LOCAL_STORAGE_KEY, id);
};

const getTopologyActiveView = () => {
  return localStorage.getItem(LAST_TOPOLOGY_VIEW_LOCAL_STORAGE_KEY);
};

export const TopologyPageContext: React.FC<TopologyPageProps> = observer(({ match }) => {
  const queryParams = useQueryParams();
  const namespace = match.params.name;
  const dataModelContext = React.useContext<ExtensibleModel>(ModelContext);
  const showListView = !!matchPath(match.path, {
    path: '*/list',
    exact: true,
  });
  const showGraphView = !!matchPath(match.path, {
    path: '*/graph',
    exact: true,
  });

  const handleNamespaceChange = (ns: string) => {
    if (ns !== namespace) {
      removeQueryArgument(TOPOLOGY_SEARCH_FILTER_KEY);
    }
  };

  React.useEffect(() => setTopologyActiveView(showListView && !showGraphView ? 'list' : 'graph'), [
    showListView,
    showGraphView,
  ]);

  if (!showGraphView && !showListView) {
    return (
      <Redirect
        to={`/topology/${namespace ? `ns/${namespace}` : 'all-namespaces'}/${
          getTopologyActiveView() === 'list' ? 'list' : 'graph'
        }${queryParams ? `?${queryParams.toString()}` : ''}`}
      />
    );
  }

  return (
    <>
      <Helmet>
        <title>Topology</title>
      </Helmet>
      <NamespacedPage
        variant={showListView ? NamespacedPageVariants.light : NamespacedPageVariants.default}
        onNamespaceChange={handleNamespaceChange}
        toolbar={
          namespace && !dataModelContext.isEmptyModel ? (
            <>
              {!showListView && namespace && (
                <Popover
                  aria-label="Shortcuts"
                  bodyContent={TopologyShortcuts}
                  position="left"
                  maxWidth="100vw"
                >
                  <Button
                    type="button"
                    variant="link"
                    className="odc-topology__shortcuts-button"
                    icon={<QuestionCircleIcon />}
                    data-test-id="topology-view-shortcuts"
                  >
                    View shortcuts
                  </Button>
                </Popover>
              )}
              <Tooltip position="left" content={showListView ? 'Topology View' : 'List View'}>
                <Link
                  className="pf-c-button pf-m-plain odc-topology__view-switcher"
                  to={`/topology/${namespace ? `ns/${namespace}` : 'all-namespaces'}${
                    showListView ? '/graph' : '/list'
                  }${queryParams ? `?${queryParams.toString()}` : ''}`}
                >
                  {showListView ? <TopologyIcon size="md" /> : <ListIcon size="md" />}
                </Link>
              </Tooltip>
            </>
          ) : null
        }
      >
        <Firehose resources={[{ kind: 'Project', prop: 'projects', isList: true }]}>
          <ProjectsExistWrapper title="Topology">
            {namespace ? (
              <TopologyDataRenderer showGraphView={showGraphView} />
            ) : (
              <CreateProjectListPage title="Topology">
                Select a project to view the topology
              </CreateProjectListPage>
            )}
          </ProjectsExistWrapper>
        </Firehose>
      </NamespacedPage>
    </>
  );
});

export const TopologyPage: React.FC<TopologyPageProps> = ({ match }) => {
  const namespace = match.params.name;
  return (
    <DataModelProvider namespace={namespace}>
      <TopologyPageContext match={match} />
    </DataModelProvider>
  );
};

export default TopologyPage;
