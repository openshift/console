import * as React from 'react';
import * as classNames from 'classnames';
import * as _ from 'lodash';
import { Model, Edge } from '@patternfly/react-topology';
import { referenceFor, modelFor } from '@console/internal/module/k8s';
import {
  ActionsMenu,
  ResourceLink,
  SidebarSectionHeading,
  ExternalLink,
} from '@console/internal/components/utils';
import { edgeActions } from '@console/dev-console/src/components/topology/actions/edgeActions';
import { TopologyDataObject } from '@console/dev-console/src/components/topology/topology-types';
import { TYPE_EVENT_SOURCE_LINK, TYPE_REVISION_TRAFFIC } from '../../topology/const';
import { setSinkSource } from '../../actions/sink-source';

export type TopologyEdgePanelProps = {
  edge: Edge;
  model: Model;
};

const connectorTypeToTitle = (type: string): string => {
  switch (type) {
    case TYPE_REVISION_TRAFFIC:
      return 'Traffic distribution connector';
    case TYPE_EVENT_SOURCE_LINK:
      return 'Event source connector';
    default:
      return '';
  }
};

const KnativeTopologyEdgePanel: React.FC<TopologyEdgePanelProps> = ({ edge, model }) => {
  const source: TopologyDataObject = edge.getSource().getData();
  const target: TopologyDataObject = edge.getTarget().getData();
  const resources = [source?.resources?.obj, target?.resources?.obj];
  const nodes = model.nodes.map((n) => edge.getController().getNodeById(n.id));
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
            {connectorTypeToTitle(edge.getType())}
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
