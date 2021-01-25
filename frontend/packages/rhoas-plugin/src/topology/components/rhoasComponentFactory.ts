import * as React from 'react';
import {
  GraphElement,
  ComponentFactory,
} from '@patternfly/react-topology';

import {
  withNoDrop
} from '@console/topology/src/components/graph-view';
import { } from '@console/topology/src/components/graph-view';
import KafkaNode from './KafkaNode';
import { ManagedKafkaConnectionModel } from "../../models"

export const getRhoasComponentFactory = (): ComponentFactory => {
  return (kind, type): React.ComponentType<{ element: GraphElement }> | undefined => {
    console.log("RHOAS Toplogy", kind, type);
    switch (type) {
      // Using resource kind as model kind for simplicity
      case ManagedKafkaConnectionModel.kind:
        return withNoDrop()(KafkaNode)
      default:
        return undefined;
    }
  };
};
