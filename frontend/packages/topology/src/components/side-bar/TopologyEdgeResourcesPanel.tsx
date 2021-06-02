import * as React from 'react';
import { Edge } from '@patternfly/react-topology';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  ResourceLink,
  SidebarSectionHeading,
  ExternalLink,
} from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleLinkModel } from '@console/internal/models';
import { K8sResourceKind, referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { TYPE_TRAFFIC_CONNECTOR } from '../../const';
import { getNamespaceDashboardKialiLink, getResource } from '../../utils/topology-utils';

type TopologyEdgeResourcesPanelProps = {
  edge: Edge;
};

const TopologyEdgeResourcesPanel: React.FC<TopologyEdgeResourcesPanelProps> = ({ edge }) => {
  const { t } = useTranslation();
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
      <SidebarSectionHeading text={t('topology~Connections')} />
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
          <SidebarSectionHeading text={t('topology~Kiali link')} />
          <ExternalLink
            href={getNamespaceDashboardKialiLink(consoleLinks, namespace)}
            text={t('topology~Kiali Graph view')}
          />
        </>
      )}
    </div>
  );
};

export default TopologyEdgeResourcesPanel;
