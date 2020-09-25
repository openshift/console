import * as React from 'react';
import * as _ from 'lodash';
import { Edge } from '@patternfly/react-topology';
import { ConsoleLinkModel } from '@console/internal/models';
import { K8sResourceKind, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import {
  ResourceLink,
  SidebarSectionHeading,
  ExternalLink,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { TYPE_TRAFFIC_CONNECTOR } from './components/const';
import { getNamespaceDashboardKialiLink, getResource } from './topology-utils';

export type TopologyEdgeResourcesPanelProps = {
  edge: Edge;
};

const TopologyEdgeResourcesPanel: React.FC<TopologyEdgeResourcesPanelProps> = ({ edge }) => {
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
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

export default TopologyEdgeResourcesPanel;
