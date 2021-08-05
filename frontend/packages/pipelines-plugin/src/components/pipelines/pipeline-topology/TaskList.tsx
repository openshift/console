import * as React from 'react';
import { Tooltip } from '@patternfly/react-core';
import { useHover } from '@patternfly/react-topology';
import * as cx from 'classnames';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { KebabOption, ResourceIcon, truncateMiddle } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { TaskKind } from '../../../types';
import { getResourceModelFromTaskKind } from '../../../utils/pipeline-augment';
import { BUILDER_NODE_ADD_RADIUS } from './const';
import RemoveNodeDecorator from './RemoveNodeDecorator';
import { NewTaskNodeCallback } from './types';

type KeyedKebabOption = KebabOption & { key: string };

const taskToOption = (task: TaskKind, callback: NewTaskNodeCallback): KeyedKebabOption => {
  const {
    kind,
    metadata: { name },
  } = task;

  return {
    key: `${name}-${kind}`,
    label: name,
    icon: <ResourceIcon kind={referenceForModel(getResourceModelFromTaskKind(kind))} />,
    callback: () => {
      callback(task);
    },
  };
};

const TaskList: React.FC<any> = ({
  width,
  height,
  listOptions,
  unselectedText,
  onRemoveTask,
  onNewTask,
  onTaskSearch,
}) => {
  const { t } = useTranslation();
  const triggerRef = React.useRef(null);
  const [hover, hoverRef] = useHover();

  const options = _.sortBy(
    listOptions.map((task) => taskToOption(task, onNewTask)),
    (o) => o.label,
  );
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
    <text x={width / 2} y={height / 2 + 1}>
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
          className={cx('odc-task-list-node__trigger-background', {
            'is-disabled': options.length === 0,
          })}
          width={width}
          height={height}
        />
        {options.length === 0 ? (
          <text className="odc-task-list-node__trigger-disabled" x={width / 2} y={height / 2 + 1}>
            {t('pipelines-plugin~No tasks')}
          </text>
        ) : (
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
              <Tooltip content={unselectedTaskText}>{renderText}</Tooltip>
            ) : (
              renderText
            )}
          </g>
        )}
      </g>
    </>
  );
};
export default TaskList;
