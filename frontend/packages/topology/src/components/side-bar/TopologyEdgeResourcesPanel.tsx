import type { FC } from 'react';
import { List, ListItem } from '@patternfly/react-core';
import type { Edge } from '@patternfly/react-topology';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ResourceLink, SidebarSectionHeading } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { ConsoleLinkModel, SecretModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { referenceFor, referenceForModel } from '@console/internal/module/k8s';
import { ExternalLink } from '@console/shared/src/components/links/ExternalLink';
import { TYPE_TRAFFIC_CONNECTOR } from '../../const';
import { getNamespaceDashboardKialiLink, getResource } from '../../utils/topology-utils';

type TopologyEdgeResourcesPanelProps = {
  edge: Edge;
};

const TopologyEdgeResourcesPanel: FC<TopologyEdgeResourcesPanelProps> = ({ edge }) => {
  const { t } = useTranslation();
  const [consoleLinks] = useK8sWatchResource<K8sResourceKind[]>({
    isList: true,
    kind: referenceForModel(ConsoleLinkModel),
    optional: true,
  });
  const source = getResource(edge.getSource());
  const target = getResource(edge.getTarget());
  const data = edge.getData();
  const resources = [source, target];
  const {
    metadata: { namespace },
  } = resources[1];

  return (
    <div className="overview__sidebar-pane-body">
      <SidebarSectionHeading text={t('topology~Connections')} />
      <List isPlain isBordered>
        {_.map(resources, (resource) => {
          if (!resource) {
            return null;
          }
          const {
            metadata: { name, uid },
            spec,
          } = resource;
          const sinkUri = spec?.sinkUri;

          return (
            <ListItem key={uid}>
              {!sinkUri ? (
                <ResourceLink
                  kind={referenceFor(resource)}
                  name={name}
                  namespace={namespace}
                  dataTest={`resource-link-${name}`}
                />
              ) : (
                <ExternalLink
                  href={sinkUri}
                  displayBlock
                  text={sinkUri}
                  dataTestID={`sink-uri-${sinkUri}`}
                />
              )}
            </ListItem>
          );
        })}
      </List>
      {data?.sbr?.status.secret && (
        <>
          <SidebarSectionHeading text={t('topology~Secret')} />
          <List isPlain isBordered>
            <ListItem key={data.sbr.status.secret}>
              <ResourceLink
                kind={referenceForModel(SecretModel)}
                name={data.sbr.status.secret}
                namespace={data.sbr.metadata.namespace}
                dataTest={`secret-resource-link-${data.sbr.status.secret}`}
              />
            </ListItem>
          </List>
        </>
      )}
      {edge.getType() === TYPE_TRAFFIC_CONNECTOR && (
        <>
          <SidebarSectionHeading text={t('topology~Kiali link')} />
          <ExternalLink
            href={getNamespaceDashboardKialiLink(consoleLinks, namespace)}
            text={t('topology~Kiali Graph view')}
            dataTestID="kiali-link"
          />
        </>
      )}
    </div>
  );
};

export default TopologyEdgeResourcesPanel;
