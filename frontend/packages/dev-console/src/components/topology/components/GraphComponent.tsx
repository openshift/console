import * as React from 'react';
import { GraphComponent as BaseGraphComponent } from '@console/topology';

type GraphComponentProps = React.ComponentProps<typeof BaseGraphComponent> & {
  dragEditInProgress?: boolean;
};

const DRAG_ACTIVE_CLASS = 'odc-m-drag-active';

const GraphComponent: React.FC<GraphComponentProps> = (props) => {
  React.useEffect(() => {
    if (props.dragEditInProgress) {
      document.body.classList.add(DRAG_ACTIVE_CLASS);
    } else {
      document.body.classList.remove(DRAG_ACTIVE_CLASS);
    }
  }, [props.dragEditInProgress]);
  return <BaseGraphComponent {...props} />;
};

export default GraphComponent;
