import * as React from 'react';
import { Node, NodeModel, observer } from '@patternfly/react-topology';
import {
  AddNodeDirection,
  BUILDER_NODE_ADD_RADIUS,
  BUILDER_NODE_ERROR_RADIUS,
  BUILDER_NODE_ADD_PADDING,
} from './const';
import ErrorNodeDecorator from './ErrorNodeDecorator';
import PlusNodeDecorator from './PlusNodeDecorator';
import TaskNode from './TaskNode';
import { BuilderNodeModelData } from './types';
import { TooltipPosition } from '@patternfly/react-core';

type BuilderNodeProps = {
  element: Node<NodeModel, BuilderNodeModelData>;
};

const BuilderNode: React.FC<BuilderNodeProps> = ({ element }) => {
  const [showAdd, setShowAdd] = React.useState(false);
  const { width, height } = element.getBounds();
  const data = element.getData();
  const { error, onAddNode, onNodeSelection } = data;

  return (
    <g
      className="odc-builder-node"
      onFocus={() => setShowAdd(true)}
      onBlur={() => setShowAdd(false)}
      onMouseOver={() => setShowAdd(true)}
      onMouseOut={() => setShowAdd(false)}
    >
      <rect
        x={-BUILDER_NODE_ADD_RADIUS * 2}
        y={0}
        width={width + BUILDER_NODE_ADD_RADIUS * 4}
        height={height + BUILDER_NODE_ADD_RADIUS * 2}
        fill="transparent"
      />
      <g onClick={() => onNodeSelection(data)}>
        <TaskNode element={element} disableTooltip />
        {error && (
          <ErrorNodeDecorator
            x={BUILDER_NODE_ERROR_RADIUS / 2}
            y={BUILDER_NODE_ERROR_RADIUS / 4}
            errorStr={error}
          />
        )}
      </g>
      <g style={{ display: showAdd ? 'block' : 'none' }}>
        <PlusNodeDecorator
          x={width + BUILDER_NODE_ADD_RADIUS + BUILDER_NODE_ADD_PADDING}
          y={height / 2}
          tooltip="Add a sequential task after this task"
          onClick={() => onAddNode(AddNodeDirection.AFTER)}
        />
        <PlusNodeDecorator
          x={-BUILDER_NODE_ADD_RADIUS - BUILDER_NODE_ADD_PADDING}
          y={height / 2}
          tooltip="Add a sequential task before this task"
          onClick={() => onAddNode(AddNodeDirection.BEFORE)}
        />
        <PlusNodeDecorator
          x={width / 2}
          y={height + BUILDER_NODE_ADD_RADIUS + BUILDER_NODE_ADD_PADDING}
          tooltip="Add a parallel task"
          tooltipPosition={TooltipPosition.bottom}
          onClick={() => onAddNode(AddNodeDirection.PARALLEL)}
        />
      </g>
    </g>
  );
};

export default observer(BuilderNode);
