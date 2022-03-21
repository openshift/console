import * as React from 'react';
import {
  Node,
  observer,
  WithDndDropProps,
  WithSelectionProps,
  WithContextMenuProps,
} from '@patternfly/react-topology';
import GroupNode from './GroupNode';

type ApplicationGroupProps = {
  element: Node;
  badge?: string;
  badgeColor?: string;
  badgeClassName?: string;
  canDrop?: boolean;
  dropTarget?: boolean;
  dragging?: boolean;
} & WithSelectionProps &
  WithDndDropProps &
  WithContextMenuProps;

const ApplicationNode: React.FC<ApplicationGroupProps> = ({
  element,
  badge,
  badgeColor,
  badgeClassName,
  ...rest
}) => {
  return (
    <GroupNode
      bgClassName="odc-application-group__bg"
      badge={badge}
      badgeColor={badgeColor}
      badgeClassName={badgeClassName}
      element={element}
      {...rest}
    />
  );
};

export default observer(ApplicationNode);
