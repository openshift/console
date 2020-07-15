import * as React from 'react';
import * as FocusTrap from 'focus-trap-react';
import { Button, Flex, FlexItem } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import Popper from '@console/shared/src/components/popper/Popper';
import { KebabItem, KebabOption } from '@console/internal/components/utils';
import { observer, Node, NodeModel } from '@patternfly/react-topology';
import { PipelineResourceTask } from '../../../utils/pipeline-augment';
import { NewTaskNodeCallback, TaskListNodeModelData } from './types';

import './TaskListNode.scss';

const taskToOption = (task: PipelineResourceTask, callback: NewTaskNodeCallback): KebabOption => {
  const {
    metadata: { name },
  } = task;

  return {
    label: name,
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
  const triggerRef = React.useRef(null);
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const { height, width } = element.getBounds();
  const { clusterTaskList, namespaceTaskList, onNewTask, onRemoveTask } = element.getData();

  const options = [
    ...namespaceTaskList.map((task) => taskToOption(task, onNewTask)),
    ...clusterTaskList.map((task) => taskToOption(task, onNewTask)),
  ];

  return (
    <foreignObject width={width} height={height} className="odc-task-list-node">
      <div className="odc-task-list-node__trigger-background" ref={triggerRef}>
        <Button
          className="odc-task-list-node__trigger"
          isDisabled={options.length === 0}
          onClick={() => {
            setMenuOpen(!isMenuOpen);
          }}
          variant="control"
        >
          {options.length === 0 ? (
            'No Tasks'
          ) : (
            <Flex flexWrap={{ default: 'nowrap' }} spaceItems={{ default: 'spaceItemsNone' }}>
              <FlexItem className="odc-task-list-node__label" grow={{ default: 'grow' }}>
                {unselectedText || 'Select task'}
              </FlexItem>
              <FlexItem>
                <CaretDownIcon />
              </FlexItem>
            </Flex>
          )}
        </Button>
      </div>
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
          <div className="pf-c-dropdown pf-m-expanded">
            <ul className="pf-c-dropdown__menu pf-m-align-right oc-kebab__popper-items odc-task-list-node__list-items">
              {options.map((option) => (
                <li key={option.label}>
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
                      option={{ label: 'Delete Task', callback: onRemoveTask }}
                      onClick={onRemoveTask}
                    />
                  </li>
                </>
              )}
            </ul>
          </div>
        </FocusTrap>
      </Popper>
    </foreignObject>
  );
};

export default observer(TaskListNode);
