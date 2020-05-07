import * as React from 'react';
import { connect } from 'react-redux';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { Edge } from '@console/topology';
import { RootState } from '@console/internal/redux-types';
import { referenceFor, K8sResourceKind } from '@console/internal/module/k8s';
import {
  ActionsMenu,
  ResourceLink,
  SidebarSectionHeading,
  ExternalLink,
} from '@console/internal/components/utils';
import {
  TYPE_EVENT_SOURCE_LINK,
  TYPE_REVISION_TRAFFIC,
} from '@console/knative-plugin/src/topology/const';
import { TYPE_CONNECTS_TO, TYPE_SERVICE_BINDING, TYPE_TRAFFIC_CONNECTOR } from './components/const';
import { edgeActions } from './actions/edgeActions';
import { TopologyDataModel, TopologyDataObject } from './topology-types';
import { getKialiLink } from './topology-utils';

type StateProps = {
  consoleLinks?: K8sResourceKind[];
};

export type TopologyEdgePanelProps = {
  edge: Edge;
  data: TopologyDataModel;
} & StateProps;

const connectorTypeToTitle = (type: string): string => {
  switch (type) {
    case TYPE_CONNECTS_TO:
      return 'Visual connector';
    case TYPE_SERVICE_BINDING:
      return 'Binding connector';
    case TYPE_REVISION_TRAFFIC:
      return 'Traffic distribution connector';
    case TYPE_EVENT_SOURCE_LINK:
      return 'Event source connector';
    case TYPE_TRAFFIC_CONNECTOR:
      return 'Traffic connector';
    default:
      return '';
  }
};

const TopologyEdgePanel: React.FC<TopologyEdgePanelProps> = ({ edge, data, consoleLinks }) => {
  const source: TopologyDataObject = edge.getSource().getData();
  const target: TopologyDataObject = edge.getTarget().getData();
  const resources = [source?.resources?.obj, target?.resources?.obj];
  const nodes = data.graph.nodes.map((n) => edge.getController().getNodeById(n.id));
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
            <ExternalLink href={getKialiLink(consoleLinks, namespace)} text="Kiali Graph View" />
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
