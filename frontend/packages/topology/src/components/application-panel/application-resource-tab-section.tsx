import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { TYPE_APPLICATION_GROUP } from '../../const';
import TopologyApplicationResources from './TopologyApplicationResources';

export const getApplicationPanelResourceTabSection = (element: GraphElement) => {
  if (element.getType() !== TYPE_APPLICATION_GROUP) return undefined;
  return (
    <TopologyApplicationResources
      resources={element.getData().groupResources}
      group={element.getLabel()}
    />
  );
};
