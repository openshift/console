import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { Edge, isNode, Node } from '@patternfly/react-topology';
import { RootState } from '@console/internal/redux';
import { referenceFor, K8sResourceKind } from '@console/internal/module/k8s';
import {
  ActionsMenu,
  ResourceLink,
  SidebarSectionHeading,
  ExternalLink,
} from '@console/internal/components/utils';
import { TYPE_CONNECTS_TO, TYPE_SERVICE_BINDING, TYPE_TRAFFIC_CONNECTOR } from './components/const';
import { edgeActions } from './actions/edgeActions';
import { getNamespaceDashboardKialiLink, getResource } from './topology-utils';

type StateProps = {
  consoleLinks?: K8sResourceKind[];
};

export type TopologyEdgePanelProps = {
  edge: Edge;
} & StateProps;

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

const TopologyEdgePanel: React.FC<TopologyEdgePanelProps> = ({ edge, consoleLinks }) => {
  const source = getResource(edge.getSource());
  const target = getResource(edge.getTarget());
  const resources = [source, target];
  const nodes = edge
    .getController()
    .getElements()
    .filter((e) => isNode(e) && !e.isGroup()) as Node[];
  const {
    metadata: { namespace },
  } = resources[1];

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
      <div className="overview__sidebar-pane-body">
        <SidebarSectionHeading text="Connections" />
        <ul className="list-group">
          {_.map(resources, (resource) => {
            if (!resource) {
              return null;
            }
            const {
              metadata: { name, uid },
            } = resource;
            return (
              <li className="list-group-item  container-fluid" key={uid}>
                <ResourceLink kind={referenceFor(resource)} name={name} namespace={namespace} />
              </li>
            );
          })}
        </ul>

        {edge.getType() === TYPE_TRAFFIC_CONNECTOR && (
          <>
            <SidebarSectionHeading text="Kiali Link" />
            <ExternalLink
              href={getNamespaceDashboardKialiLink(consoleLinks, namespace)}
              text="Kiali Graph View"
            />
          </>
        )}
      </div>
    </div>
  );
};

const TopologyEdgeStateToProps = (state: RootState) => {
  const consoleLinks = state.UI.get('consoleLinks');
  return { consoleLinks };
};

export default connect(TopologyEdgeStateToProps)(TopologyEdgePanel);
