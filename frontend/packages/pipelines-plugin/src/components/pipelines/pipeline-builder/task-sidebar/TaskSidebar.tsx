import * as React from 'react';
import { useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { ActionsMenu, ResourceIcon, CloseButton } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import { getResourceModelFromTaskKind } from '../../../../utils/pipeline-augment';
import {
  PipelineTask,
  PipelineTaskParam,
  PipelineTaskResource,
  TektonResource,
  TaskKind,
  PipelineWorkspace,
} from '../../../../types';
import { getTaskParameters, getTaskResources } from '../../resource-utils';
import { ResourceTarget, TaskErrorMap, UpdateOperationUpdateTaskData } from '../types';
import TaskSidebarParam from './TaskSidebarParam';
import TaskSidebarResource from './TaskSidebarResource';
import TaskSidebarName from './TaskSidebarName';
import TaskSidebarWorkspace from './TaskSidebarWorkspace';

import './TaskSidebar.scss';

type TaskSidebarProps = {
  errorMap: TaskErrorMap;
  onRemoveTask: (taskName: string) => void;
  onUpdateTask: (data: UpdateOperationUpdateTaskData) => void;
  resourceList: TektonResource[];
  workspaceList: PipelineWorkspace[];
  selectedPipelineTaskIndex: number;
  taskResource: TaskKind;
  isFinallyTask: boolean;
  onClose: () => void;
};

const TaskSidebar: React.FC<TaskSidebarProps> = (props) => {
  const {
    onRemoveTask,
    onUpdateTask,
    resourceList,
    workspaceList,
    selectedPipelineTaskIndex,
    taskResource,
    isFinallyTask,
    onClose,
  } = props;
  const { t } = useTranslation();
  const taskType = isFinallyTask ? 'finallyTasks' : 'tasks';
  const formikTaskReference = `formData.${taskType}.${selectedPipelineTaskIndex}`;
  const [taskField] = useField<PipelineTask>(formikTaskReference);

  const updateTask = (newData: Partial<UpdateOperationUpdateTaskData>) => {
    onUpdateTask({ thisPipelineTask: taskField.value, taskResource, ...newData });
  };

  const params = getTaskParameters(taskResource);
  const resources = getTaskResources(taskResource);
  const inputResources = resources.inputs;
  const outputResources = resources.outputs;
  const workspaces = taskResource.spec.workspaces || [];

  const renderResource = (type: ResourceTarget) => (resource: TektonResource) => {
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
      <div className="co-sidebar-dismiss clearfix">
        <CloseButton onClick={onClose} />
      </div>
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
                  label: t('pipelines-plugin~Remove Task'),
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
            <h2>{t('pipelines-plugin~Parameters')}</h2>
            {params.map((param) => {
              const taskParams: PipelineTaskParam[] = taskField.value?.params || [];
              const thisParam = taskParams.find(
                (taskFieldParam) => taskFieldParam.name === param.name,
              );
              return (
                <div key={param.name} className="odc-task-sidebar__param">
                  <TaskSidebarParam
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

        {workspaces.length !== 0 && (
          <>
            <h2>{t('pipelines-plugin~Workspaces')}</h2>
            {workspaces.map((workspace) => {
              const selectedWorkspace = taskField.value?.workspaces?.find(
                ({ name }) => name === workspace.name,
              );
              return (
                <div key={workspace.name} className="odc-task-sidebar__workspace">
                  <TaskSidebarWorkspace
                    availableWorkspaces={workspaceList}
                    taskWorkspace={workspace}
                    selectedWorkspace={selectedWorkspace}
                    onChange={(workspaceName, pipelineWorkspace) => {
                      updateTask({
                        workspaces: {
                          workspaceName,
                          selectedWorkspace: pipelineWorkspace,
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
            <h2>{t('pipelines-plugin~Input resources')}</h2>
            {inputResources.map(renderResource('inputs'))}
          </>
        )}
        {outputResources && (
          <>
            <h2>{t('pipelines-plugin~Output resources')}</h2>
            {outputResources.map(renderResource('outputs'))}
          </>
        )}
      </div>
    </div>
  );
};

export default TaskSidebar;
