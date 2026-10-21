import type { FC } from 'react';
import type {
  WithSourceDragProps,
  WithTargetDragProps,
  WithContextMenuProps,
  Edge,
} from '@patternfly/react-topology';
import { observer, EdgeTerminalType } from '@patternfly/react-topology';
import BaseEdge from './BaseEdge';

import './ConnectsTo.scss';

type ConnectsToProps = {
  element: Edge;
  dragging?: boolean;
} & WithSourceDragProps &
  WithTargetDragProps &
  WithContextMenuProps;
const ConnectsTo: FC<ConnectsToProps> = (props) => (
  <BaseEdge
    className="odc-connects-to"
    endTerminalType={EdgeTerminalType.directionalAlt}
    {...props}
  />
);

export default observer(ConnectsTo);
