import * as React from 'react';
import { Edge, Node, isNode } from '@patternfly/react-topology';
import * as classNames from 'classnames';
import { TFunction } from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  ActionsMenu,
  ResourceLink,
  SidebarSectionHeading,
  ExternalLink,
} from '@console/internal/components/utils';
import { referenceFor, modelFor } from '@console/internal/module/k8s';
import { edgeActions } from '@console/topology/src/actions';
import { TopologyDataObject } from '@console/topology/src/topology-types';
import { setSinkSource } from '../../actions/sink-source';
import {
  TYPE_EVENT_SOURCE_LINK,
  TYPE_KAFKA_CONNECTION_LINK,
  TYPE_REVISION_TRAFFIC,
} from '../../topology/const';

export type TopologyEdgePanelProps = {
  edge: Edge;
};

const connectorTypeToTitle = (type: string, t: TFunction): string => {
  switch (type) {
    case TYPE_REVISION_TRAFFIC:
      return t('knative-plugin~Traffic distribution connector');
    case TYPE_EVENT_SOURCE_LINK:
      return t('knative-plugin~Event source connector');
    case TYPE_KAFKA_CONNECTION_LINK:
      return t('knative-plugin~Kafka connector');
    default:
      return '';
  }
};

const KnativeTopologyEdgePanel: React.FC<TopologyEdgePanelProps> = ({ edge }) => {
  const { t } = useTranslation();
  const source: TopologyDataObject = edge.getSource().getData();
  const target: TopologyDataObject = edge.getTarget().getData();
  const resources = [source?.resources?.obj, target?.resources?.obj];
  const nodes = edge
    .getController()
    .getElements()
    .filter((e) => isNode(e) && !e.isGroup()) as Node[];
  const isEventSourceConnector = edge.getType() === TYPE_EVENT_SOURCE_LINK;
  const actions = [];

  if (isEventSourceConnector && source.resource) {
    const sourceModel = modelFor(referenceFor(source.resource));
    actions.push(setSinkSource(sourceModel, source.resource));
  }

  return (
    <div className="overview__sidebar-pane resource-overview">
      <div className="overview__sidebar-pane-head resource-overview__heading">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            {connectorTypeToTitle(edge.getType(), t)}
          </div>
          <div className="co-actions">
            <ActionsMenu actions={!isEventSourceConnector ? edgeActions(edge, nodes) : actions} />
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
          <button type="button">{t('knative-plugin~Resources')}</button>
        </li>
      </ul>
      <div className="overview__sidebar-pane-body">
        <SidebarSectionHeading text={t('knative-plugin~Connections')} />
        <ul className="list-group">
          {_.map(resources, (resource) => {
            if (!resource) {
              return null;
            }
            const {
              metadata: { name, uid, namespace },
              spec,
            } = resource;
            const sinkUri = spec?.sinkUri;
            return (
              <li className="list-group-item  container-fluid" key={uid}>
                {!sinkUri ? (
                  <ResourceLink kind={referenceFor(resource)} name={name} namespace={namespace} />
                ) : (
                  <ExternalLink
                    href={sinkUri}
                    additionalClassName="co-external-link--block"
                    text={sinkUri}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default KnativeTopologyEdgePanel;
