import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { FormikErrors, useField } from 'formik';
import { Trans, useTranslation } from 'react-i18next';
import {
  PipelineTask,
  PipelineTaskParam,
  TektonResource,
  TektonWorkspace,
  TektonParam,
  PipelineTaskResource,
  ResourceTarget,
  TektonResourceGroup,
} from '../../../../types';
import { getTaskParameters, getTaskResources } from '../../resource-utils';
import { SelectedBuilderTask, TaskType, UpdateOperationRenameTaskData } from '../types';
import TaskSidebarHeader from './TaskSidebarHeader';
import TaskSidebarName from './TaskSidebarName';
import TaskSidebarParam from './TaskSidebarParam';
import TaskSidebarResource from './TaskSidebarResource';
import TaskSidebarWhenExpression from './TaskSidebarWhenExpression';
import TaskSidebarWorkspace from './TaskSidebarWorkspace';

import './TaskSidebar.scss';

type TaskSidebarProps = {
  errorMap: FormikErrors<PipelineTask>[];
  onRemoveTask: (taskName: string) => void;
  onRenameTask: (data: UpdateOperationRenameTaskData) => void;
  resourceList: TektonResource[];
  workspaceList: TektonWorkspace[];
  selectedData: SelectedBuilderTask;
  onClose: () => void;
};

/** Protect against -1 index for Formik 'name' use-cases */
function safeIndex<T>(list: T[], comparatorFunc: (v: T) => boolean): number {
  const idx = list.findIndex(comparatorFunc);
  return idx === -1 ? list.length : idx;
}

const TaskSidebar: React.FC<TaskSidebarProps> = (props) => {
  const { t } = useTranslation();
  const { onRemoveTask, onRenameTask, resourceList, workspaceList, selectedData, onClose } = props;
  const { isFinallyTask, taskIndex, resource: taskResource } = selectedData;
  const taskType: TaskType = isFinallyTask ? 'finallyTasks' : 'tasks';
  const formikTaskReference = `formData.${taskType}.${taskIndex}`;
  const [{ value: thisTask }] = useField<PipelineTask>(formikTaskReference);

  const params: TektonParam[] = getTaskParameters(taskResource) || [];
  const resources: TektonResourceGroup<TektonResource> = getTaskResources(taskResource);
  const inputResources: TektonResource[] = resources.inputs || [];
  const outputResources: TektonResource[] = resources.outputs || [];
  const workspaces: TektonWorkspace[] = taskResource.spec.workspaces || [];

  const renderResource = (type: ResourceTarget) => (resource: TektonResource) => {
    const taskResources: PipelineTaskResource[] = thisTask.resources?.[type] || [];
    const resourceIdx = safeIndex(taskResources, (thisParam) => thisParam.name === resource.name);
    return (
      <div key={resource.name} className="odc-task-sidebar__resource">
        <TaskSidebarResource
          availableResources={resourceList}
          hasResource={!!taskResources[resourceIdx]}
          name={`${formikTaskReference}.resources.${type}.${resourceIdx}`}
          resource={resource}
        />
      </div>
    );
  };

  return (
    <Stack className="opp-task-sidebar">
      <StackItem className="opp-task-sidebar__header">
        <TaskSidebarHeader
          onClose={onClose}
          taskResource={taskResource}
          removeThisTask={() => onRemoveTask(thisTask.name)}
        />
      </StackItem>
      <StackItem className="opp-task-sidebar__content pf-c-form">
        <TaskSidebarName
          initialName={thisTask.name}
          taskName={taskResource.metadata.name}
          // We need to do this through an update call because runAfters are tied to the name and we need to fix those
          // with this change to maintain a healthy and stable graph
          onChange={(newName) => onRenameTask({ preChangePipelineTask: thisTask, newName })}
        />

        {params.length > 0 && (
          <div>
            <h2>{t('pipelines-plugin~Parameters')}</h2>
            <p className="co-help-text">
              <Trans ns="pipelines-plugin">
                Use this format when you reference variables in this form: <code>$(</code>
              </Trans>
            </p>
            {params.map((param) => {
              const taskParams: PipelineTaskParam[] = thisTask.params || [];
              const paramIdx = safeIndex(taskParams, (thisParam) => thisParam.name === param.name);
              return (
                <div key={param.name} className="opp-task-sidebar__param">
                  <TaskSidebarParam
                    hasParam={!!taskParams[paramIdx]}
                    name={`${formikTaskReference}.params.${paramIdx}`}
                    resourceParam={param}
                    selectedData={selectedData}
                  />
                </div>
              );
            })}
          </div>
        )}
        {workspaces.length > 0 && (
          <div>
            <h2>{t('pipelines-plugin~Workspaces')}</h2>
            {workspaces.map((workspace) => {
              const taskWorkspaces: TektonWorkspace[] = thisTask.workspaces || [];
              const workspaceIdx = safeIndex(
                taskWorkspaces,
                (thisWorkspace) => thisWorkspace.name === workspace.name,
              );
              return (
                <div key={workspace.name} className="opp-task-sidebar__workspace">
                  <TaskSidebarWorkspace
                    availableWorkspaces={workspaceList}
                    hasWorkspace={!!taskWorkspaces[workspaceIdx]}
                    name={`${formikTaskReference}.workspaces.${workspaceIdx}`}
                    resourceWorkspace={workspace}
                  />
                </div>
              );
            })}
          </div>
        )}

        {inputResources.length > 0 && (
          <div>
            <h2>{t('pipelines-plugin~Input resources')}</h2>
            {inputResources.map(renderResource('inputs'))}
          </div>
        )}
        {outputResources.length > 0 && (
          <div>
            <h2>{t('pipelines-plugin~Output resources')}</h2>
            {outputResources.map(renderResource('outputs'))}
          </div>
        )}
        <div className="opp-task-sidebar__when-expressions">
          <TaskSidebarWhenExpression
            hasParam={false}
            name={`${formikTaskReference}.when`}
            selectedData={selectedData}
          />
        </div>
      </StackItem>
    </Stack>
  );
};

export default TaskSidebar;
