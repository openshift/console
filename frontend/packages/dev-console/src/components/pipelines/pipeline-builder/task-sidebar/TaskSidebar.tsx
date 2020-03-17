import * as React from 'react';
import { useField } from 'formik';
import { ActionsMenu, ResourceIcon } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import {
  getResourceModelFromTaskKind,
  PipelineResource,
  PipelineResourceTask,
  PipelineResourceTaskResource,
  PipelineTask,
} from '../../../../utils/pipeline-augment';
import { getTaskParameters, getTaskResources } from '../../resource-utils';
import { ResourceTarget, UpdateOperationUpdateTaskData } from '../types';
import TaskSidebarParam from './TaskSidebarParam';
import TaskSidebarResource from './TaskSidebarResource';
import TaskSidebarName from './TaskSidebarName';

import './TaskSidebar.scss';

type TaskSidebarProps = {
  onNameUpdate: (data: UpdateOperationUpdateTaskData) => void;
  onRemoveTask: (taskName: string) => void;
  resourceList: PipelineResource[];
  selectedPipelineTaskIndex: number;
  taskResource: PipelineResourceTask;
};

const TaskSidebar: React.FC<TaskSidebarProps> = (props) => {
  const {
    onNameUpdate,
    onRemoveTask,
    resourceList,
    selectedPipelineTaskIndex,
    taskResource,
  } = props;
  const formikTaskReference = `tasks.${selectedPipelineTaskIndex}`;
  const [taskField] = useField<PipelineTask>(formikTaskReference);

  const params = getTaskParameters(taskResource);
  const resources = getTaskResources(taskResource);
  const inputResources = resources.inputs;
  const outputResources = resources.outputs;

  const renderResource = (type: ResourceTarget) => (
    resource: PipelineResourceTaskResource,
    idx: number,
  ) => {
    return (
      <div key={resource.name} className="odc-task-sidebar__resource">
        <TaskSidebarResource
          name={`${formikTaskReference}.resources.${type}.${idx}`}
          availableResources={resourceList}
          resource={resource}
        />
      </div>
    );
  };

  return (
    <div className="odc-task-sidebar">
      <div className="odc-task-sidebar__header">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon
              className="co-m-resource-icon--lg"
              kind={referenceFor(getResourceModelFromTaskKind(taskResource.kind))}
            />
            {taskResource.metadata.name}
          </div>
          <div className="co-actions">
            <ActionsMenu
              actions={[
                {
                  label: 'Remove Task',
                  callback: () => onRemoveTask(taskField.value.name),
                },
              ]}
            />
          </div>
        </h1>
      </div>
      <hr />

      <div className="odc-task-sidebar__content">
        <TaskSidebarName
          name={`${formikTaskReference}.name`}
          placeholder={taskResource.metadata.name}
          onChange={(newName: string) => {
            onNameUpdate({ oldName: taskField.value.name, newName });
          }}
        />

        {params.length > 0 && (
          <>
            <h2>Parameters</h2>
            {params.map((param, idx) => {
              return (
                <div key={param.name} className="odc-task-sidebar__param">
                  <TaskSidebarParam
                    name={`${formikTaskReference}.params.${idx}`}
                    resourceParam={param}
                  />
                </div>
              );
            })}
          </>
        )}

        {inputResources && (
          <>
            <h2>Input Resources</h2>
            {inputResources.map(renderResource('inputs'))}
          </>
        )}
        {outputResources && (
          <>
            <h2>Output Resources</h2>
            {outputResources.map(renderResource('outputs'))}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskSidebar;
