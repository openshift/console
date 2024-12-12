import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { TrashIcon } from '@patternfly/react-icons/dist/esm/icons/trash-icon';
import {
  t_temp_dev_tbd as greyColor /* CODEMODS: you should update this color token, original v5 token was global_palette_black_500 */,
} from '@patternfly/react-tokens';
import { BUILDER_NODE_DECORATOR_RADIUS } from './const';

import './RemoveNodeDecorator.scss';

type RemoveNodeDecoratorProps = {
  content: string;
  x: number;
  y: number;
  removeCallback?: () => void;
};

const RemoveNodeDecorator: React.FC<RemoveNodeDecoratorProps> = ({
  content,
  x,
  y,
  removeCallback = () => {},
}) => {
  const trashRef = React.useRef();
  return (
    <Tooltip triggerRef={trashRef} content={content}>
      <g
        ref={trashRef}
        className="opp-remove-node-decorator"
        transform={`translate(${x}, ${y})`}
        onClick={(e) => {
          e.stopPropagation();
          removeCallback();
        }}
        data-id="delete-task"
      >
        <circle cx={0} cy={0} r={BUILDER_NODE_DECORATOR_RADIUS} fill={greyColor.value} />
        <g transform="translate(-6, -6)">
          <TrashIcon color="white" />
        </g>
      </g>
    </Tooltip>
  );
};

export default RemoveNodeDecorator;
