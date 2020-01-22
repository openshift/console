import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { ExclamationIcon, PlusIcon } from '@patternfly/react-icons';
import { Node, observer } from '@console/topology';
import { AddNodeDirection, BUILDER_NODE_ADD_RADIUS, BUILDER_NODE_ERROR_RADIUS } from './const';
import TaskNode from './TaskNode';
import { BuilderNodeModelData } from './types';

import './BuilderNode.scss';

const drawAdd = (x, y, onClick) => {
  return (
    <g className="odc-builder-node__add-icon" onClick={onClick} transform={`translate(${x}, ${y})`}>
      <circle cx={0} cy={0} r={BUILDER_NODE_ADD_RADIUS} fill="blue" />
      <g transform="translate(-6, -6)">
        <PlusIcon color="white" />
      </g>
    </g>
  );
};

const drawError = (errorStr: string) => {
  return (
    <g
      className="odc-builder-node__error-icon"
      transform={`translate(${BUILDER_NODE_ERROR_RADIUS / 2}, ${BUILDER_NODE_ERROR_RADIUS / 4})`}
    >
      <circle
        cx={0}
        cy={0}
        r={BUILDER_NODE_ERROR_RADIUS}
        fill="var(--pf-global--danger-color--100)"
      />
      <g transform="translate(-5, -7)">
        <foreignObject width={BUILDER_NODE_ERROR_RADIUS * 2} height={BUILDER_NODE_ERROR_RADIUS * 2}>
          <Tooltip content={errorStr}>
            <ExclamationIcon color="white" />
          </Tooltip>
        </foreignObject>
      </g>
    </g>
  );
};

const BuilderNode: React.FC<{ element: Node }> = ({ element }) => {
  const [showAdd, setShowAdd] = React.useState(false);
  const { width, height } = element.getBounds();
  const data: BuilderNodeModelData = element.getData();
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
        <TaskNode element={element} />
        {error?.message && drawError(error.message)}
      </g>
      <g style={{ display: showAdd ? 'block' : 'none' }}>
        {drawAdd(width + BUILDER_NODE_ADD_RADIUS, height / 2, () =>
          onAddNode(AddNodeDirection.AFTER),
        )}
        {drawAdd(-BUILDER_NODE_ADD_RADIUS, height / 2, () => onAddNode(AddNodeDirection.BEFORE))}
        {drawAdd(width / 2, height + BUILDER_NODE_ADD_RADIUS, () =>
          onAddNode(AddNodeDirection.PARALLEL),
        )}
      </g>
    </g>
  );
};

export default observer(BuilderNode);
