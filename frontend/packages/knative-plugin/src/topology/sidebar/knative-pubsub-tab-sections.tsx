import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { ResourceSummary } from '@console/internal/components/utils';
import { getResource } from '@console/topology/src/utils';
import EventPubSubResources from '../../components/overview/EventPubSubResources';
import { TYPE_EVENT_PUB_SUB, TYPE_EVENT_PUB_SUB_LINK } from '../const';

export const getDetailsTabPubSubSectionForTopologySideBar = (element: GraphElement) => {
  if (![TYPE_EVENT_PUB_SUB, TYPE_EVENT_PUB_SUB_LINK].includes(element.getType())) return undefined;
  const obj = getResource(element);
  return (
    <div className="overview__sidebar-pane-body resource-overview__body">
      <div className="resource-overview__summary">
        <ResourceSummary resource={obj} />
      </div>
    </div>
  );
};

export const getResourceTabPubSubSectionForTopologySidebar = (element: GraphElement) => {
  if (![TYPE_EVENT_PUB_SUB, TYPE_EVENT_PUB_SUB_LINK].includes(element.getType())) return undefined;
  const itemResources = element.getData();
  return (
    <div className="overview__sidebar-pane-body">
      <EventPubSubResources item={itemResources.resources} />
    </div>
  );
};
