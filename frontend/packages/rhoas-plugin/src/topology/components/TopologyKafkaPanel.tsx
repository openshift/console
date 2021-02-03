import * as React from 'react';
import { connect } from 'react-redux';
import {
  navFactory,
  SimpleTabNav,
  ResourceIcon,
  ResourceSummary,
  SectionHeading,
} from '@console/internal/components/utils';
import * as UIActions from '@console/internal/actions/ui';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import { Node } from '@patternfly/react-topology';

import './TopologyKafkaPanel.css';

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
  const { kafkaId } = obj.spec;

  return (
    <div className="co-m-pane__body">
      <SectionHeading text="Managed Kafka details" />
      <div className="row">
        <div className="col-sm-6">
          <ResourceSummary resource={obj} />
        </div>
        <dl className="co-m-pane__details">
          <dt>Cloud provider</dt>
          <dd>Empty</dd>
          <dt>Region</dt>
          <dd>Empty</dd>
          <dt>ID</dt>
          <dd>{kafkaId}</dd>
          <dt>Owner</dt>
          <dd>Empty</dd>
        </dl>
      </div>
    </div>
  );
};

const ResourcesComponent = ({ obj }) => {
  const secret = obj.status.serviceAccountSecretName;

  return <div className="overview__sidebar-pane-body">{secret}</div>;
};

export const ConnectedTopologyHelmReleasePanel: React.FC<TopologyHelmReleasePanelProps> = ({
  item,
  selectedDetailsTab,
  onClickTab,
}: TopologyHelmReleasePanelProps) => {
  const [showAlert, setShowAlert] = React.useState(true);

  // Resource
  const mkc = item?.getData().resource;
  if (!mkc) {
    return <>No data</>;
  }

  const handleAlertFunction = () => {
    if (showAlert) {
      setShowAlert(false);
    }
  };

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon className="co-m-resource-icon--lg" kind="MKC" />
            <h3>Managed Kafka Connection</h3>
          </div>
        </h1>
        {showAlert && (
          <div className="kafka-panel-alert">
            <Alert
              variant="default"
              title="Managed Service"
              actionClose={<AlertActionCloseButton onClick={handleAlertFunction} />}
              isInline
            >
              This resource represents service that exist outside your cluster. To view details
              about resource please go to
              <a href="https://cloud.redhat.com/beta/application-services/openshift-streams/">
                {' '}
                OpenShift Streams Apache Kafka{' '}
              </a>{' '}
              console.
            </Alert>
          </div>
        )}
      </div>

      <SimpleTabNav
        selectedTab={selectedDetailsTab}
        onClickTab={onClickTab}
        tabs={[
          { name: 'Details', component: navFactory.details(DetailsComponent).component },
          { name: 'Resources', component: ResourcesComponent },
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
