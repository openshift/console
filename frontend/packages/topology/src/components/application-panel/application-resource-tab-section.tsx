import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { DetailsTabSectionExtensionHook } from '@console/dynamic-plugin-sdk/src/extensions/topology-details';
import { TYPE_APPLICATION_GROUP } from '../../const';
import TopologyApplicationResources from './TopologyApplicationResources';

export const useApplicationPanelResourceTabSection: DetailsTabSectionExtensionHook = (
  element: GraphElement,
) => {
  if (element.getType() !== TYPE_APPLICATION_GROUP) {
    return [undefined, true, undefined];
  }
  const section = (
    <TopologyApplicationResources
      resources={element.getData().groupResources}
      group={element.getLabel()}
    />
  );
  return [section, true, undefined];
};
