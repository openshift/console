import * as React from 'react';
import Helmet from 'react-helmet';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { TopologyIcon } from '@patternfly/react-icons';
import { Firehose } from '@console/internal/components/utils';
import { getResourceList } from '@console/shared';
import { ALL_NAMESPACES_KEY } from '@console/internal/const';
import NamespacedPage from '../NamespacedPage';
import ProjectsExistWrapper from '../ProjectsExistWrapper';
import ProjectListPage from '../projects/ProjectListPage';
import ConnectedTopologyDataController from '../topology/TopologyDataController';
import TopologyToggleIcon from './TopologyToggleIcon';
import TopologyListController from './TopologyListController';

const TopologyListPageController: React.FC = () => {
  const { resources } = getResourceList(getActiveNamespace());
  return (
    <Firehose resources={resources}>
      <TopologyListController />
    </Firehose>
  );
};

const TopologyListPage: React.FC = () => {
  return (
    <>
      <Helmet>
        <title>Topology List</title>
      </Helmet>
      <NamespacedPage
        toolbarOptions={
          <TopologyToggleIcon
            url={`/topology/${
              getActiveNamespace() === ALL_NAMESPACES_KEY
                ? 'all-namespaces'
                : `ns/${getActiveNamespace()}`
            }`}
            icon={<TopologyIcon size="md" />}
            tooltipText="Topology View"
          />
        }
      >
        <Firehose resources={[{ kind: 'Project', prop: 'projects', isList: true }]}>
          <ProjectsExistWrapper title="Topology">
            {() => {
              return getActiveNamespace() !== ALL_NAMESPACES_KEY ? (
                <ConnectedTopologyDataController
                  namespace={getActiveNamespace()}
                  render={TopologyListPageController}
                />
              ) : (
                <ProjectListPage title="Topology">
                  Select a project to view the topology
                </ProjectListPage>
              );
            }}
          </ProjectsExistWrapper>
        </Firehose>
      </NamespacedPage>
    </>
  );
};

export default TopologyListPage;
