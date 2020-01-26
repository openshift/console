import * as React from 'react';
import * as FocusTrap from 'focus-trap-react';
import { Button } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';
import Popper from '@console/shared/src/components/popper/Popper';
import { KebabMenuItems, KebabOption } from '@console/internal/components/utils';
import { observer, Node } from '@console/topology';
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

const TaskListNode: React.FC<{ element: Node }> = ({ element }) => {
  const triggerRef = React.useRef(null);
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const { height, width } = element.getBounds();
  const {
    clusterTaskList,
    namespaceTaskList,
    onNewTask,
  } = element.getData() as TaskListNodeModelData;

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
            <>
              Select task <CaretDownIcon />
            </>
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
            <KebabMenuItems
              options={options}
              onClick={(e, option) => {
                option.callback && option.callback();
              }}
              className="oc-kebab__popper-items odc-task-list-node__list-items"
            />
          </div>
        </FocusTrap>
      </Popper>
    </foreignObject>
  );
};

export default observer(TaskListNode);
