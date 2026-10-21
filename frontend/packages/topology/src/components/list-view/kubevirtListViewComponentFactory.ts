import type { ComponentType } from 'react';
import type { Node } from '@patternfly/react-topology';
import VMListViewNode from './VMListViewNode';

const TYPE_VIRTUAL_MACHINE = 'virtual-machine';

export const kubevirtListViewNodeComponentFactory = (
  type,
):
  | ComponentType<{
      item: Node;
      selectedIds: string[];
      onSelect: (ids: string[]) => void;
    }>
  | undefined => {
  switch (type) {
    case TYPE_VIRTUAL_MACHINE:
      return VMListViewNode;
    default:
      return null;
  }
};
