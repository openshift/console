import * as React from 'react';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux';
import {
  ResourceIcon,
  SimpleTabNav,
  ActionsMenu,
  resourcePathFromModel,
} from '@console/internal/components/utils';
import * as UIActions from '@console/internal/actions/ui';
import { Node } from '@console/topology';
import { modelFor } from '@console/internal/module/k8s';
import { vmActions } from './components/kubevirtComponentFactory';
import { TopologyVmDetailsPanel } from './TopologyVmDetailsPanel';
import { TopologyVmResourcesPanel } from './TopologyVmResourcesPanel';

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
  vm: Node;
};

type TopologyVmPanelProps = PropsFromState & PropsFromDispatch & OwnProps;

export const ConnectedTopologyVmPanel: React.FC<TopologyVmPanelProps> = ({
  vm,
  selectedDetailsTab,
  onClickTab,
}: TopologyVmPanelProps) => {
  const name = vm.getLabel();
  const vmData = vm.getData();
  const vmObj = vmData.resources.obj;
  const { namespace } = vmObj.metadata;
  const detailsComponent = () => <TopologyVmDetailsPanel vm={vm} />;
  const resourcesComponent = () => <TopologyVmResourcesPanel vmNode={vm} />;

  const actions = vmActions(vm.getData());
  return (
    <div className="overview__sidebar-pane">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon className="co-m-resource-icon--lg" kind={vmObj.kind} />
            {name && (
              <Link
                to={resourcePathFromModel(modelFor(vmObj.kind), name, namespace)}
                className="co-resource-item__resource-name"
              >
                {name}
              </Link>
            )}
          </div>
          {actions?.length && (
            <div className="co-actions">
              <ActionsMenu actions={actions} />
            </div>
          )}
        </h1>
      </div>
      <SimpleTabNav
        selectedTab={selectedDetailsTab || 'Resources'}
        onClickTab={onClickTab}
        tabs={[
          { name: 'Details', component: detailsComponent },
          { name: 'Resources', component: resourcesComponent },
        ]}
        tabProps={{ obj: vmObj }}
        additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
      />
    </div>
  );
};

const TopologyVmPanel = connect<PropsFromState, PropsFromDispatch, TopologyVmPanelProps>(
  stateToProps,
  dispatchToProps,
)(ConnectedTopologyVmPanel);

export default TopologyVmPanel;
