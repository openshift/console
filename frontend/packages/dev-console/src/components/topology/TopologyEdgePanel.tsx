import * as React from 'react';
import * as classNames from 'classnames';
import { Edge, isNode, Node } from '@patternfly/react-topology';
import { ActionsMenu } from '@console/internal/components/utils';
import { TYPE_CONNECTS_TO, TYPE_SERVICE_BINDING, TYPE_TRAFFIC_CONNECTOR } from './components/const';
import { edgeActions } from './actions/edgeActions';
import TopologyEdgeResourcesPanel from './TopologyEdgeResourcesPanel';

export type TopologyEdgePanelProps = {
  edge: Edge;
};

const connectorTypeToTitle = (type: string): string => {
  switch (type) {
    case TYPE_CONNECTS_TO:
      return 'Visual connector';
    case TYPE_SERVICE_BINDING:
      return 'Binding connector';
    case TYPE_TRAFFIC_CONNECTOR:
      return 'Traffic connector';
    default:
      return '';
  }
};

const TopologyEdgePanel: React.FC<TopologyEdgePanelProps> = ({ edge }) => {
  const nodes = edge
    .getController()
    .getElements()
    .filter((e) => isNode(e) && !e.isGroup()) as Node[];

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            {connectorTypeToTitle(edge.getType())}
          </div>
          <div className="co-actions">
            <ActionsMenu actions={edgeActions(edge, nodes)} />
          </div>
        </h1>
      </div>
      <ul
        className={classNames(
          'co-m-horizontal-nav__menu',
          'co-m-horizontal-nav__menu--within-sidebar',
          'co-m-horizontal-nav__menu--within-overview-sidebar',
          'odc-application-resource-tab',
        )}
      >
        <li className="co-m-horizontal-nav__menu-item">
          <button type="button">Resources</button>
        </li>
      </ul>
      <TopologyEdgeResourcesPanel edge={edge} />
    </div>
  );
};

export default TopologyEdgePanel;
