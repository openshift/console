import * as React from 'react';
import { FormikErrors, useField } from 'formik';
import { useTranslation } from 'react-i18next';
import { ActionsMenu, ResourceIcon, CloseButton } from '@console/internal/components/utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { getResourceModelFromTaskKind } from '../../../../utils/pipeline-augment';
import {
  PipelineTask,
  PipelineTaskParam,
  TektonResource,
  TektonWorkspace,
  TektonParam,
  PipelineTaskResource,
  ResourceTarget,
} from '../../../../types';
import { getTaskParameters, getTaskResources, InputOutputResources } from '../../resource-utils';
import { SelectedBuilderTask, TaskType, UpdateOperationRenameTaskData } from '../types';
import TaskSidebarParam from './TaskSidebarParam';
import TaskSidebarResource from './TaskSidebarResource';
import TaskSidebarName from './TaskSidebarName';
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
  const {
    onRemoveTask,
    onRenameTask,
    resourceList,
    workspaceList,
    selectedData: { isFinallyTask, taskIndex, resource: taskResource },
    onClose,
  } = props;
  const taskType: TaskType = isFinallyTask ? 'finallyTasks' : 'tasks';
  const formikTaskReference = `formData.${taskType}.${taskIndex}`;
  const [{ value: thisTask }] = useField<PipelineTask>(formikTaskReference);

  const params: TektonParam[] = getTaskParameters(taskResource) || [];
  const resources: InputOutputResources = getTaskResources(taskResource);
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
    <div className="odc-task-sidebar">
      <div className="co-sidebar-dismiss clearfix">
        <CloseButton onClick={onClose} />
      </div>
      <div className="odc-task-sidebar__header">
        <h1 className="co-m-pane__heading">
          <div className="co-m-pane__name co-resource-item">
            <ResourceIcon
              className="co-m-resource-icon--lg"
              kind={referenceForModel(getResourceModelFromTaskKind(taskResource.kind))}
            />
            {taskResource.metadata.name}
          </div>
          <div className="co-actions">
            <ActionsMenu
              actions={[
                {
                  label: t('pipelines-plugin~Remove Task'),
                  callback: () => onRemoveTask(thisTask.name),
                },
              ]}
            />
          </div>
        </h1>
      </div>
      <hr />

      <div className="odc-task-sidebar__content">
        <TaskSidebarName
          initialName={thisTask.name}
          taskName={taskResource.metadata.name}
          // We need to do this through an update call because runAfters are tied to the name and we need to fix those
          // with this change to maintain a healthy and stable graph
          onChange={(newName) => onRenameTask({ preChangePipelineTask: thisTask, newName })}
        />

        {params.length > 0 && (
          <>
            <h2>{t('pipelines-plugin~Parameters')}</h2>
            {params.map((param) => {
              const taskParams: PipelineTaskParam[] = thisTask.params || [];
              const paramIdx = safeIndex(taskParams, (thisParam) => thisParam.name === param.name);
              return (
                <div key={param.name} className="odc-task-sidebar__param">
                  <TaskSidebarParam
                    hasParam={!!taskParams[paramIdx]}
                    name={`${formikTaskReference}.params.${paramIdx}`}
                    resourceParam={param}
                  />
                </div>
              );
            })}
          </>
        )}

        {workspaces.length > 0 && (
          <>
            <h2>{t('pipelines-plugin~Workspaces')}</h2>
            {workspaces.map((workspace) => {
              const taskWorkspaces: TektonWorkspace[] = thisTask.workspaces || [];
              const workspaceIdx = safeIndex(
                taskWorkspaces,
                (thisWorkspace) => thisWorkspace.name === workspace.name,
              );
              return (
                <div key={workspace.name} className="odc-task-sidebar__workspace">
                  <TaskSidebarWorkspace
                    availableWorkspaces={workspaceList}
                    hasWorkspace={!!taskWorkspaces[workspaceIdx]}
                    name={`${formikTaskReference}.workspaces.${workspaceIdx}`}
                    resourceWorkspace={workspace}
                  />
                </div>
              );
            })}
          </>
        )}

        {inputResources.length > 0 && (
          <>
            <h2>{t('pipelines-plugin~Input resources')}</h2>
            {inputResources.map(renderResource('inputs'))}
          </>
        )}
        {outputResources.length > 0 && (
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
