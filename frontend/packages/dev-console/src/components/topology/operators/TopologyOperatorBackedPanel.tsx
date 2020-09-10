import * as React from 'react';
import { connect } from 'react-redux';
import * as UIActions from '@console/internal/actions/ui';
import { ManagedByOperatorResourceLink } from '@console/internal/components/utils/managed-by';
import { modelFor, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import {
  SimpleTabNav,
  ResourceSummary,
  SectionHeading,
  ActionsMenu,
  StatusBox,
} from '@console/internal/components/utils';
import TopologyOperatorBackedResources from './TopologyOperatorBackedResources';
import { TopologyDataObject } from '../topology-types';
import { OperatorGroupData } from './operator-topology-types';
import {
  ClusterServiceVersionAction,
  isClusterServiceVersionAction,
  useExtensions,
} from '@console/plugin-sdk/src';
import {
  ClusterServiceVersionKind,
  ClusterServiceVersionModel,
} from '@console/operator-lifecycle-manager/src';
import { useK8sWatchResources } from '@console/internal/components/utils/k8s-watch-hook';
import { getOperandActions } from '@console/operator-lifecycle-manager/src/components/operand';

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

export type TopologyOperatorBackedPanelProps = {
  item: TopologyDataObject<OperatorGroupData>;
};

const ConnectedTopologyOperatorBackedPanel: React.FC<PropsFromState &
  PropsFromDispatch &
  TopologyOperatorBackedPanelProps> = ({ item, onClickTab, selectedDetailsTab }) => {
  const { name, resource } = item;
  const { namespace } = resource.metadata;
  const csvName = resource.metadata.selfLink.split('/').pop();
  const reference = referenceFor(resource);
  const actionExtensions = useExtensions<ClusterServiceVersionAction>(
    isClusterServiceVersionAction,
  );
  const menuActions = React.useMemo(() => getOperandActions(reference, actionExtensions, csvName), [
    reference,
    actionExtensions,
    csvName,
  ]);
  const actions = menuActions.map((a) => a(modelFor(reference), resource));
  const resourcesList = React.useMemo(() => {
    return {
      csv: {
        kind: referenceForModel(ClusterServiceVersionModel),
        name: csvName,
        namespace,
        isList: false,
      },
    };
  }, [csvName, namespace]);

  const resources = useK8sWatchResources(resourcesList);
  const ResourcesSection = () => (
    <TopologyOperatorBackedResources
      item={item}
      csv={resources.csv.data as ClusterServiceVersionKind}
    />
  );
  const DetailsSection = () => (
    <div className="overview__sidebar-pane-body">
      <SectionHeading text="Operator Details" />
      <ResourceSummary resource={resource} />
    </div>
  );

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ManagedByOperatorResourceLink
              csvName={csvName}
              namespace={resource.metadata.namespace}
              owner={{
                name,
                kind: resource.kind,
                uid: resource.metadata.uid,
                apiVersion: resource.apiVersion,
              }}
            />
          </div>
          <div className="co-actions">
            <ActionsMenu actions={actions} />
          </div>
        </h1>
      </div>
      <StatusBox
        data={resources.csv.data}
        loaded={resources.csv.loaded}
        loadError={resources.csv.loadError}
        label="Operator Details"
      >
        <SimpleTabNav
          selectedTab={selectedDetailsTab || 'Resources'}
          onClickTab={onClickTab}
          tabs={[
            { name: 'Details', component: DetailsSection },
            { name: 'Resources', component: ResourcesSection },
          ]}
          tabProps={null}
          additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
        />
      </StatusBox>
    </div>
  );
};

const TopologyOperatorBackedPanel = connect<
  PropsFromState,
  PropsFromDispatch,
  TopologyOperatorBackedPanelProps
>(
  stateToProps,
  dispatchToProps,
)(ConnectedTopologyOperatorBackedPanel);

export default TopologyOperatorBackedPanel;
