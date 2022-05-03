import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import EventPubSubResources from '../../components/overview/EventPubSubResources';
import { TYPE_EVENT_PUB_SUB, TYPE_EVENT_PUB_SUB_LINK } from '../const';

export const useResourceTabPubSubSectionForTopologySidebar: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (![TYPE_EVENT_PUB_SUB, TYPE_EVENT_PUB_SUB_LINK].includes(element.getType())) {
    return [undefined, true, undefined];
  }
  const itemResources = element.getData();
  const section = (
    <div className="overview__sidebar-pane-body">
      <EventPubSubResources item={itemResources.resources} />
    </div>
  );
  return [section, true, undefined];
};
