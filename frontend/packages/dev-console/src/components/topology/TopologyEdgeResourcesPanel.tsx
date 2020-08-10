import * as React from 'react';
import { connect } from 'react-redux';
import * as _ from 'lodash';
import { Edge } from '@patternfly/react-topology';
import { RootState } from '@console/internal/redux';
import { referenceFor, K8sResourceKind } from '@console/internal/module/k8s';
import {
  ResourceLink,
  SidebarSectionHeading,
  ExternalLink,
} from '@console/internal/components/utils';
import { TYPE_TRAFFIC_CONNECTOR } from './components/const';
import { getNamespaceDashboardKialiLink, getResource } from './topology-utils';

type StateProps = {
  consoleLinks?: K8sResourceKind[];
};

export type TopologyEdgeResourcesPanelProps = {
  edge: Edge;
} & StateProps;

const TopologyEdgeResourcesPanel: React.FC<TopologyEdgeResourcesPanelProps> = ({
  edge,
  consoleLinks,
}) => {
  const source = getResource(edge.getSource());
  const target = getResource(edge.getTarget());
  const resources = [source, target];
  const {
    metadata: { namespace },
  } = resources[1];

  return (
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
  );
};

const TopologyEdgeResourcesStateToProps = (state: RootState) => {
  const consoleLinks = state.UI.get('consoleLinks');
  return { consoleLinks };
};

export default connect(TopologyEdgeResourcesStateToProps)(TopologyEdgeResourcesPanel);
