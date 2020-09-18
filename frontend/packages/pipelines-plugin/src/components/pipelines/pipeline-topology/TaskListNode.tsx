import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import * as cx from 'classnames';
import { FocusTrap } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import Popper from '@console/shared/src/components/popper/Popper';
import {
  KebabItem,
  KebabOption,
  ResourceIcon,
  truncateMiddle,
} from '@console/internal/components/utils';
import { observer, Node, NodeModel, useHover } from '@patternfly/react-topology';
import { PipelineResourceTask } from '../../../utils/pipeline-augment';
import { NewTaskNodeCallback, TaskListNodeModelData } from './types';

import './TaskListNode.scss';

type KeyedKebabOption = KebabOption & { key: string };

const taskToOption = (
  task: PipelineResourceTask,
  callback: NewTaskNodeCallback,
): KeyedKebabOption => {
  const {
    kind,
    metadata: { name },
  } = task;

  return {
    key: `${name}-${kind}`,
    label: name,
    icon: <ResourceIcon kind={kind} />,
    callback: () => {
      callback(task);
    },
  };
};

type TaskListNodeProps = {
  element: Node<NodeModel, TaskListNodeModelData>;
  unselectedText?: string;
};

const TaskListNode: React.FC<TaskListNodeProps> = ({ element, unselectedText }) => {
  const { t } = useTranslation();
  const triggerRef = React.useRef(null);
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const { height, width } = element.getBounds();
  const { clusterTaskList, namespaceTaskList, onNewTask, onRemoveTask } = element.getData();

  const options = _.sortBy(
    [
      ...namespaceTaskList.map((task) => taskToOption(task, onNewTask)),
      ...clusterTaskList.map((task) => taskToOption(task, onNewTask)),
    ],
    (o) => o.label,
  );

  const unselectedTaskText = React.useMemo(
    () =>
      truncateMiddle(unselectedText, { length: 10, truncateEnd: true }) ||
      t('pipelines-plugin~Select Task'),
    [unselectedText, t],
  );

  const [hover, hoverRef] = useHover();

  return (
    <>
      <g
        ref={hoverRef}
        className="odc-task-list-node__trigger"
        onClick={() => setMenuOpen(!isMenuOpen)}
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
            {t('pipelines-plugin~No Tasks')}
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
            <text x={width / 2 - 10} y={height / 2 + 1}>
              {unselectedTaskText}
            </text>
            <g transform={`translate(${width - 30}, ${height / 4})`}>
              <CaretDownIcon />
            </g>
          </g>
        )}
      </g>
      <Popper
        open={isMenuOpen}
        placement="bottom-start"
        closeOnEsc
        closeOnOutsideClick
        onRequestClose={(e) => {
          if (!e || !triggerRef?.current?.contains(e.target as Element)) {
            setMenuOpen(false);
          }
        }}
        reference={() => triggerRef.current}
      >
        <FocusTrap
          focusTrapOptions={{ clickOutsideDeactivates: true, returnFocusOnDeactivate: false }}
        >
          <div className="pf-c-dropdown pf-m-expanded odc-task-list-node__container">
            <ul className="pf-c-dropdown__menu pf-m-align-right oc-kebab__popper-items odc-task-list-node__list-items">
              {options.map((option) => (
                <li key={option.key}>
                  <KebabItem
                    option={option}
                    onClick={() => {
                      option.callback && option.callback();
                    }}
                  />
                </li>
              ))}
              {onRemoveTask && (
                <>
                  <li>
                    <hr className="odc-task-list-node__divider" />
                  </li>
                  <li>
                    <KebabItem
                      option={{ label: t('pipelines-plugin~Delete Task'), callback: onRemoveTask }}
                      onClick={onRemoveTask}
                    />
                  </li>
                </>
              )}
            </ul>
          </div>
        </FocusTrap>
      </Popper>
    </>
  );
};

export default observer(TaskListNode);
