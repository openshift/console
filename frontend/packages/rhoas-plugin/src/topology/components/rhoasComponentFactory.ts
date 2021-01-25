import * as React from 'react';
import {
  GraphElement,
  ComponentFactory,
} from '@patternfly/react-topology';

import {
  withNoDrop
} from '@console/topology/src/components/graph-view';
import { } from '@console/topology/src/components/graph-view';
import KafkaConnection from './KafkaConnection';


export const getRhoasComponentFactory = (): ComponentFactory => {
  return (kind, type): React.ComponentType<{ element: GraphElement }> | undefined => {
    console.log(kind, type);
    switch (type) {
      case "ManagedKafkaConnection":
        return withNoDrop()(KafkaConnection)
      default:
        return undefined;
    }
  };
};
