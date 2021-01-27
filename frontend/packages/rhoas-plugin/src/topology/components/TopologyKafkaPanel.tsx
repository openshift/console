import * as React from 'react';
import { connect } from 'react-redux';
import {
  navFactory,
  SimpleTabNav,
  ResourceIcon
} from '@console/internal/components/utils';
import * as UIActions from '@console/internal/actions/ui';
import { Node } from '@patternfly/react-topology';
import { ResourceSummary } from '@console/internal/components/utils';

type PropsFromState = {
  selectedDetailsTab?: any;
};

type PropsFromDispatch = {
  onClickTab?: (name: string) => void;
};

const stateToProps = ({ UI }): PropsFromState => ({
  selectedDetailsTab: UI.getIn(['overview', 'selectedDetailsTab']),
});

const dispatchToProps = (dispatch): PropsFromDispatch => ({
  onClickTab: (name) => dispatch(UIActions.selectOverviewDetailsTab(name)),
});

type OwnProps = {
  item: Node;
};

type TopologyHelmReleasePanelProps = PropsFromState & PropsFromDispatch & OwnProps;

const DetailsComponent: React.FC<any> = ({ obj }) => {
  return (<>
    <div style={{ "padding": 20 }}>
      <ResourceSummary resource={obj} />
    </div>
  </>)
}

export const ConnectedTopologyHelmReleasePanel: React.FC<TopologyHelmReleasePanelProps> = ({
  item,
  selectedDetailsTab,
  onClickTab,
}: TopologyHelmReleasePanelProps) => {
  // Resource
  const mkc = item?.getData().resource;
  if (!mkc) {
    return <>No data</>
  }

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon className="co-m-resource-icon--lg" kind="MKC" />
            <h4>Managed Kafka Connection</h4>
          </div>
        </h1>
      </div>
      <SimpleTabNav
        selectedTab={selectedDetailsTab}
        onClickTab={onClickTab}
        tabs={[
          { name: "Details", component: navFactory.details(DetailsComponent).component },
        ]}
        tabProps={{ obj: mkc }}
        additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
      />
    </div>
  );
};

export default connect<PropsFromState, PropsFromDispatch, TopologyHelmReleasePanelProps>(
  stateToProps,
  dispatchToProps,
)(ConnectedTopologyHelmReleasePanel);
