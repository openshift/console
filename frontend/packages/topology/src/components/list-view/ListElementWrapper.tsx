/* eslint-disable @typescript-eslint/no-use-before-define */
import type { FC, ReactNode } from 'react';
import { useMemo } from 'react';
import type { Node } from '@patternfly/react-topology';
import { isNode } from '@patternfly/react-topology';
import { observer } from 'mobx-react';
import { labelForNodeKind } from '@console/shared';
import { getResourceKind } from '../../utils/topology-utils';
import { listViewNodeComponentFactory } from './listViewComponentFactory';

interface ListElementWrapperProps {
  item: Node;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  children?: ReactNode;
}

// in a separate component so that changes to behaviors do not re-render children
const ListElementComponent: FC<ListElementWrapperProps> = observer(function ListElementComponent({
  item,
  selectedIds,
  onSelect,
  children,
}) {
  const type = item.getType();

  const Component = useMemo(() => listViewNodeComponentFactory(type), [type]);
  return (
    <Component key={item.getId()} item={item} selectedIds={selectedIds} onSelect={onSelect}>
      {children}
    </Component>
  );
});

const ListElementChildren: FC<ListElementWrapperProps> = observer(function ListElementChildren({
  item,
  selectedIds,
  onSelect,
}) {
  return (
    <>
      {item
        .getChildren()
        .filter(isNode)
        .sort((a, b) =>
          labelForNodeKind(getResourceKind(a)).localeCompare(labelForNodeKind(getResourceKind(b))),
        )
        .map((e) => (
          <ListElementWrapper
            key={e.getId()}
            item={e as Node}
            onSelect={onSelect}
            selectedIds={selectedIds}
          />
        ))}
    </>
  );
});

const ListElementWrapper: FC<ListElementWrapperProps> = observer(function ListElementWrapper({
  item,
  selectedIds,
  onSelect,
}) {
  if (!item.isVisible()) {
    return null;
  }

  return (
    <ListElementComponent item={item} onSelect={onSelect} selectedIds={selectedIds}>
      <ListElementChildren item={item} onSelect={onSelect} selectedIds={selectedIds} />
    </ListElementComponent>
  );
});

export default ListElementWrapper;
