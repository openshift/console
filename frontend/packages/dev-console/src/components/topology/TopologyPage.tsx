import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { matchPath, match as RMatch, Link } from 'react-router-dom';
import { Tooltip, Popover, Button } from '@patternfly/react-core';
import { ListIcon, TopologyIcon, QuestionCircleIcon } from '@patternfly/react-icons';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { ALL_APPLICATIONS_KEY } from '@console/shared';
import { StatusBox, Firehose, HintBlock, AsyncComponent } from '@console/internal/components/utils';
import { RootState } from '@console/internal/redux';
import { FLAG_KNATIVE_SERVING_SERVICE } from '@console/knative-plugin';
import EmptyState from '../EmptyState';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import ProjectsExistWrapper from '../ProjectsExistWrapper';
import ProjectListPage from '../projects/ProjectListPage';
import { ALLOW_SERVICE_BINDING } from '../../const';
import { getCheURL } from './topology-utils';
import ConnectedTopologyDataController, { RenderProps } from './TopologyDataController';
import Topology from './Topology';
import TopologyShortcuts from './TopologyShortcuts';
import './TopologyPage.scss';

interface StateProps {
  activeApplication: string;
  knative: boolean;
  cheURL: string;
  serviceBinding: boolean;
}

export interface TopologyPageProps {
  match: RMatch<{
    name?: string;
  }>;
}

type Props = TopologyPageProps & StateProps;

const EmptyMsg = () => (
  <EmptyState
    title="Topology"
    hintBlock={
      <HintBlock title="No workloads found">
        <p>
          To add content to your project, create an application, component or service using one of
          these options.
        </p>
      </HintBlock>
    }
  />
);

export function renderTopology({ loaded, loadError, serviceBinding, data }: RenderProps) {
  return (
    <StatusBox
      data={data ? data.graph.nodes : null}
      label="Topology"
      loaded={loaded}
      loadError={loadError}
      EmptyMsg={EmptyMsg}
    >
      <div className="odc-topology">
        <Topology data={data} serviceBinding={serviceBinding} />
      </div>
    </StatusBox>
  );
}

const TopologyPage: React.FC<Props> = ({
  match,
  activeApplication,
  knative,
  cheURL,
  serviceBinding,
}) => {
  const namespace = match.params.name;
  const application = activeApplication === ALL_APPLICATIONS_KEY ? undefined : activeApplication;
  const showListView = !!matchPath(match.path, {
    path: '*/list',
    exact: true,
  });

  return (
    <>
      <Helmet>
        <title>Topology</title>
      </Helmet>
      <NamespacedPage
        variant={showListView ? NamespacedPageVariants.light : NamespacedPageVariants.default}
        hideApplications={showListView}
        toolbar={
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
                >
                  View shortcuts
                </Button>
              </Popover>
            )}
            <Tooltip position="left" content={showListView ? 'Topology View' : 'List View'}>
              <Link
                className="pf-c-button pf-m-plain"
                to={`/topology/${namespace ? `ns/${namespace}` : 'all-namespaces'}${
                  showListView ? '' : '/list'
                }`}
              >
                {showListView ? <TopologyIcon size="md" /> : <ListIcon size="md" />}
              </Link>
            </Tooltip>
          </>
        }
      >
        <Firehose resources={[{ kind: 'Project', prop: 'projects', isList: true }]}>
          <ProjectsExistWrapper title="Topology">
            {() => {
              return namespace ? (
                showListView ? (
                  <AsyncComponent
                    mock={false}
                    match={match}
                    title=""
                    loader={() =>
                      import(
                        '@console/internal/components/overview' /* webpackChunkName: "topology-overview" */
                      ).then((m) => m.Overview)
                    }
                  />
                ) : (
                  <ConnectedTopologyDataController
                    application={application}
                    namespace={namespace}
                    render={renderTopology}
                    knative={knative}
                    cheURL={cheURL}
                    serviceBinding={serviceBinding}
                  />
                )
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

const getKnativeStatus = ({ FLAGS }: RootState): boolean => FLAGS.get(FLAG_KNATIVE_SERVING_SERVICE);

const getServiceBindingStatus = ({ FLAGS }: RootState): boolean => FLAGS.get(ALLOW_SERVICE_BINDING);

const mapStateToProps = (state: RootState): StateProps => {
  const consoleLinks = state.UI.get('consoleLinks');
  return {
    activeApplication: getActiveApplication(state),
    knative: getKnativeStatus(state),
    cheURL: getCheURL(consoleLinks),
    serviceBinding: getServiceBindingStatus(state),
  };
};

export default connect(mapStateToProps)(TopologyPage);
