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
  PipelineTaskParam,
  PipelineTaskResource,
} from '../../../../utils/pipeline-augment';
import { ResourceTarget, TaskErrorMap, UpdateOperationUpdateTaskData } from '../types';
import { TaskErrorType } from '../const';
import TaskSidebarParam from './TaskSidebarParam';
import TaskSidebarResource from './TaskSidebarResource';
import TaskSidebarName from './TaskSidebarName';

import './TaskSidebar.scss';

type TaskSidebarProps = {
  errorMap: TaskErrorMap;
  onRemoveTask: (taskName: string) => void;
  onUpdateTask: (data: UpdateOperationUpdateTaskData) => void;
  resourceList: PipelineResource[];
  selectedPipelineTaskIndex: number;
  taskResource: PipelineResourceTask;
};

const TaskSidebar: React.FC<TaskSidebarProps> = (props) => {
  const {
    errorMap,
    onRemoveTask,
    onUpdateTask,
    resourceList,
    selectedPipelineTaskIndex,
    taskResource,
  } = props;
  const formikTaskReference = `tasks.${selectedPipelineTaskIndex}`;
  const [taskField] = useField<PipelineTask>(formikTaskReference);

  const updateTask = (newData: Partial<UpdateOperationUpdateTaskData>) => {
    onUpdateTask({ thisPipelineTask: taskField.value, taskResource, ...newData });
  };

  const thisTaskError = errorMap[taskField.value.name];

  const params = taskResource.spec?.params;
  const inputResources = taskResource.spec?.resources?.inputs;
  const outputResources = taskResource.spec?.resources?.outputs;

  const renderResource = (type: ResourceTarget) => (resource: PipelineResourceTaskResource) => {
    const taskResources: PipelineTaskResource[] = taskField.value?.resources?.[type] || [];
    const thisResource = taskResources.find(
      (taskFieldResource) => taskFieldResource.name === resource.name,
    );

    return (
      <div key={resource.name} className="odc-task-sidebar__resource">
        <TaskSidebarResource
          availableResources={resourceList}
          onChange={(resourceName, selectedResource) => {
            updateTask({
              resources: {
                resourceTarget: type,
                selectedPipelineResource: selectedResource,
                taskResourceName: resourceName,
              },
            });
          }}
          taskResource={thisResource}
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
          initialName={taskField.value.name}
          taskName={taskResource.metadata.name}
          onChange={(newName) => updateTask({ newName })}
        />

        {params && (
          <>
            <h2>Parameters</h2>
            {params.map((param) => {
              const taskParams: PipelineTaskParam[] = taskField.value?.params || [];
              const thisParam = taskParams.find(
                (taskFieldParam) => taskFieldParam.name === param.name,
              );
              return (
                <div key={param.name} className="odc-task-sidebar__param">
                  <TaskSidebarParam
                    hasParamError={!!thisTaskError?.includes(TaskErrorType.MISSING_REQUIRED_PARAMS)}
                    resourceParam={param}
                    taskParam={thisParam}
                    onChange={(value) => {
                      updateTask({
                        params: {
                          newValue: value,
                          taskParamName: param.name,
                        },
                      });
                    }}
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
