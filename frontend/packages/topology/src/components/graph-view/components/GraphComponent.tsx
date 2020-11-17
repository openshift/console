import * as React from 'react';
import * as classNames from 'classnames';
import {
  GraphComponent as BaseGraphComponent,
  WithContextMenuProps,
} from '@patternfly/react-topology';

type GraphComponentProps = React.ComponentProps<typeof BaseGraphComponent> & {
  dragEditInProgress?: boolean;
  hasDropTarget?: boolean;
  dragCreate?: boolean;
} & WithContextMenuProps;

const DRAG_ACTIVE_CLASS = 'odc-m-drag-active';
const VALID_DROP_CLASS = 'odc-m-valid-drop-target';

const GraphComponent: React.FC<GraphComponentProps> = (props) => {
  const { dragEditInProgress, hasDropTarget, dragCreate } = props;
  const graphClasses = classNames('odc-graph', { 'odc-m-drag-create': dragCreate });

  React.useEffect(() => {
    const addClassList = [];
    const removeClassList = [];

    dragEditInProgress
      ? addClassList.push(DRAG_ACTIVE_CLASS)
      : removeClassList.push(DRAG_ACTIVE_CLASS);
    hasDropTarget ? addClassList.push(VALID_DROP_CLASS) : removeClassList.push(VALID_DROP_CLASS);

    if (addClassList.length) {
      addClassList.forEach((className) => document.body.classList.add(className));
    }
    if (removeClassList.length) {
      removeClassList.forEach((className) => document.body.classList.remove(className));
    }
  }, [dragEditInProgress, hasDropTarget]);
  return (
    <g className={graphClasses}>
      <BaseGraphComponent {...props} />
    </g>
  );
};

export default GraphComponent;
