import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { useHover } from '@patternfly/react-topology';
import * as cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { truncateMiddle } from '@console/internal/components/utils';
import { BUILDER_NODE_ADD_RADIUS } from './const';
import RemoveNodeDecorator from './RemoveNodeDecorator';

const TaskList: React.FC<any> = ({
  width,
  height,
  unselectedText,
  onRemoveTask,
  onNewTask,
  onTaskSearch,
}) => {
  const { t } = useTranslation();
  const triggerRef = React.useRef(null);
  const textRef = React.useRef();
  const [hover, hoverRef] = useHover();

  const unselectedTaskText = unselectedText || t('pipelines-plugin~Add task');

  const truncatedTaskText = React.useMemo(
    () =>
      truncateMiddle(unselectedTaskText, {
        length: 10,
        truncateEnd: true,
      }),
    [unselectedTaskText],
  );
  const renderText = (
    <text
      x={width / 2}
      y={height / 2 + 1}
      className="odc-task-list-node__render-text"
      ref={textRef}
    >
      {truncatedTaskText}
    </text>
  );

  return (
    <>
      <g
        data-test="task-list"
        ref={hoverRef}
        className="odc-task-list-node__trigger"
        onClick={(e) => {
          e.stopPropagation();
          onTaskSearch(onNewTask);
        }}
      >
        <rect
          ref={triggerRef}
          className={cx('odc-task-list-node__trigger-background')}
          width={width}
          height={height}
        />
        <g>
          <rect
            className={
              hover
                ? 'odc-task-list-node__trigger-underline--hover'
                : 'odc-task-list-node__trigger-underline'
            }
            y={height}
            width={width}
            height={hover ? 2 : 1}
          />

          {onRemoveTask && hover && (
            <g>
              <RemoveNodeDecorator
                removeCallback={onRemoveTask}
                x={120}
                y={BUILDER_NODE_ADD_RADIUS / 4}
                content={t('pipelines-plugin~Delete task')}
              />
            </g>
          )}
          {unselectedTaskText !== truncatedTaskText ? (
            <Tooltip content={unselectedTaskText} triggerRef={textRef}>
              {renderText}
            </Tooltip>
          ) : (
            renderText
          )}
        </g>
      </g>
    </>
  );
};
export default TaskList;
