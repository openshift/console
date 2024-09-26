import * as React from 'react';
import { Node } from '@patternfly/react-topology';
import { TYPE_VIRTUAL_MACHINE } from '../components/const';
import { VmListViewNode } from './VmListViewNode';

export const kubevirtListViewNodeComponentFactory = (
  type,
):
  | React.ComponentType<{
      item: Node;
      selectedIds: string[];
      onSelect: (ids: string[]) => void;
    }>
  | undefined => {
  switch (type) {
    case TYPE_VIRTUAL_MACHINE:
      return VmListViewNode;
    default:
      return null;
  }
};
