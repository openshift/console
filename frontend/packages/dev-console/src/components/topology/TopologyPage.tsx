import * as React from 'react';
import { Helmet } from 'react-helmet';
import { connect } from 'react-redux';
import { match as RMatch } from 'react-router-dom';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { ALL_APPLICATIONS_KEY } from '@console/internal/const';
import { StatusBox } from '@console/internal/components/utils';
import { RootState } from '@console/internal/redux';
import { FLAG_KNATIVE_SERVING } from '@console/knative-plugin/src/const';
import EmptyState from '../EmptyState';
import NamespacedPage from '../NamespacedPage';
import DefaultPage from '../DefaultPage';
import TopologyDataController, { RenderProps } from './TopologyDataController';
import Topology from './Topology';

interface StateProps {
  activeApplication: string;
  knative: boolean;
}

export interface TopologyPageProps {
  match: RMatch<{
    ns?: string;
  }>;
}

type Props = TopologyPageProps & StateProps;

const EmptyMsg = () => <EmptyState title="Topology" />;

export function renderTopology({ loaded, loadError, data }: RenderProps) {
  return (
    <StatusBox
      data={data ? data.graph.nodes : null}
      label="Topology"
      loaded={loaded}
      loadError={loadError}
      EmptyMsg={EmptyMsg}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          bottom: 0,
        }}
      >
        <Topology data={data} />
      </div>
    </StatusBox>
  );
}

const TopologyPage: React.FC<Props> = ({ match, activeApplication, knative }) => {
  const namespace = match.params.ns;
  const application = activeApplication === ALL_APPLICATIONS_KEY ? undefined : activeApplication;
  return (
    <React.Fragment>
      <Helmet>
        <title>Topology</title>
      </Helmet>
      <NamespacedPage>
        {namespace ? (
          <TopologyDataController
            application={application}
            namespace={namespace}
            render={renderTopology}
            knative={knative}
          />
        ) : (
          <DefaultPage title="Topology">Select a project to view the topology</DefaultPage>
        )}
      </NamespacedPage>
    </React.Fragment>
  );
};

const getKnativeStatus = ({ FLAGS }: RootState): boolean => FLAGS.get(FLAG_KNATIVE_SERVING);

const mapStateToProps = (state: RootState): StateProps => {
  return {
    activeApplication: getActiveApplication(state),
    knative: getKnativeStatus(state),
  };
};

export default connect(mapStateToProps)(TopologyPage);
