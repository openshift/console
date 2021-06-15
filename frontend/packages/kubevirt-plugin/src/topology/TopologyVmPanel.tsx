import * as React from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import * as UIActions from '@console/internal/actions/ui';
import {
  ActionsMenu,
  ResourceIcon,
  resourcePathFromModel,
  SimpleTabNav,
} from '@console/internal/components/utils';
import { getResource } from '@console/topology/src/utils';
import { observer } from '@patternfly/react-topology';

import { vmActions } from './components/kubevirtComponentFactory';
import { TopologyVmDetailsPanel } from './TopologyVmDetailsPanel';
import { TopologyVmResourcesPanel } from './TopologyVmResourcesPanel';
import { VMNode } from './types';
import { VirtualMachineModel } from '../models';
import { getKubevirtAvailableModel } from '../models/kvReferenceForModel';

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
  vmNode: VMNode;
};

type TopologyVmPanelProps = PropsFromState & PropsFromDispatch & OwnProps;

export const ConnectedTopologyVmPanel: React.FC<TopologyVmPanelProps> = ({
  vmNode,
  onClickTab,
}: TopologyVmPanelProps) => {
  const { t } = useTranslation();
  const name = vmNode.getLabel();
  const vmData = vmNode.getData();
  const vmObj = getResource(vmNode);
  const { namespace } = vmObj.metadata;
  const actions = vmActions(vmObj, vmData);

  return (
    <div className="overview__sidebar-pane">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon className="co-m-resource-icon--lg" kind={vmObj.kind} />
            {name && (
              <Link
                to={resourcePathFromModel(
                  getKubevirtAvailableModel(VirtualMachineModel),
                  name,
                  namespace,
                )}
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
        onClickTab={onClickTab}
        tabs={[
          { name: t('kubevirt-plugin~Details'), component: TopologyVmDetailsPanel },
          { name: t('kubevirt-plugin~Resources'), component: TopologyVmResourcesPanel },
        ]}
        tabProps={{ vmNode }}
        additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
      />
    </div>
  );
};

const TopologyVmPanel = connect<PropsFromState, PropsFromDispatch, TopologyVmPanelProps>(
  stateToProps,
  dispatchToProps,
)(observer(ConnectedTopologyVmPanel));

export default TopologyVmPanel;
