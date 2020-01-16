import * as React from 'react';
import * as _ from 'lodash';
import { useField } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared';
import { ActionsMenu, ResourceIcon } from '@console/internal/components/utils';
import { referenceFor } from '@console/internal/module/k8s';
import {
  getResourceModelFromTask,
  PipelineResource,
  PipelineResourceTask,
  PipelineResourceTaskResource,
  PipelineTask,
  PipelineTaskParam,
  PipelineTaskResource,
} from '../../../../utils/pipeline-augment';
import TaskSidebarParam from './TaskSidebarParam';
import { convertResourceToTask } from '../utils';
import TaskSidebarResource from './TaskSidebarResource';
import { TaskErrorMap } from '../types';

type TaskSidebarProps = {
  errorMap: TaskErrorMap;
  onRemoveTask: (taskName: string) => void;
  resourceList: PipelineResource[];
  setFieldValue: (formikId: string, newValue: any) => void;
  selectedPipelineTaskIndex: number;
  taskResource: PipelineResourceTask;
  updateErrorMap: (errorMap: TaskErrorMap) => void;
};

const TaskSidebar: React.FC<TaskSidebarProps> = (props) => {
  const {
    errorMap,
    onRemoveTask,
    resourceList,
    setFieldValue,
    selectedPipelineTaskIndex,
    taskResource,
    updateErrorMap,
  } = props;
  const formikTaskReference = `tasks.${selectedPipelineTaskIndex}`;
  const [taskField] = useField<PipelineTask>(formikTaskReference);

  if (!taskField?.value?.name) {
    return null;
  }

  const thisTaskError = errorMap[taskField.value.name];

  const params = taskResource.spec?.inputs?.params;
  const inputResources = taskResource.spec?.inputs?.resources;
  const outputResources = taskResource.spec?.outputs?.resources;

  const renderResource = (type: 'inputs' | 'outputs') => (
    resource: PipelineResourceTaskResource,
  ) => {
    const taskResources: PipelineTaskResource[] = taskField.value?.resources?.[type] || [];
    const thisResource = taskResources.find(
      (taskFieldResource) => taskFieldResource.name === resource.name,
    );

    return (
      <TaskSidebarResource
        key={resource.name}
        availableResources={resourceList}
        onChange={(resourceName, selectedResource) => {
          const newResources = [
            ...taskResources
              .map((tResource) => {
                if (tResource.name === resourceName) {
                  return null;
                }
                return taskResource;
              })
              .filter((r) => !!r),
            {
              name: resourceName,
              resource: selectedResource.name,
            },
          ];
          setFieldValue(`${formikTaskReference}.resources.${type}`, newResources);

          const id = type === 'inputs' ? 'inputResourceCount' : 'outputResourceCount';
          if (thisTaskError && thisTaskError[id] === newResources.length) {
            // Has errors but no longer resource errors
            if (!thisTaskError[id]) {
              return;
            }

            updateErrorMap({
              ...errorMap,
              [taskField.value.name]: _.omit(thisTaskError, id),
            });
          }
        }}
        taskResource={thisResource}
        resource={resource}
      />
    );
  };

  return (
    <div className="odc-task-sidebar">
      <h1 className="co-m-pane__heading">
        <div className="co-m-pane__name co-resource-item">
          <ResourceIcon
            className="co-m-resource-icon--lg"
            // TODO: wowzers on the indirection
            kind={referenceFor(getResourceModelFromTask(convertResourceToTask(taskResource)))}
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
      <InputField
        label="Display Name"
        name={`${formikTaskReference}.name`}
        type={TextInputTypes.text}
      />

      {params && (
        <>
          <h2>Parameters</h2>
          {params.map((param) => {
            const taskParams = taskField.value?.params || [];
            const thisParam = taskParams.find(
              (taskFieldParam) => taskFieldParam.name === param.name,
            );
            return (
              <TaskSidebarParam
                key={param.name}
                resourceParam={param}
                taskParam={thisParam}
                onChange={(value) => {
                  const newParams = taskParams.map((taskParam) => {
                    if (taskParam === thisParam) {
                      return {
                        ...taskParam,
                        value,
                      } as PipelineTaskParam;
                    }
                    return taskParam;
                  });
                  setFieldValue(formikTaskReference, {
                    ...taskField.value,
                    params: newParams,
                  });

                  const datalessParams = newParams.filter((p) => !p.value).length > 0;
                  if (thisTaskError && !datalessParams) {
                    // Has errors but no longer param errors
                    if (!thisTaskError.paramsMissingDefaults) {
                      return;
                    }

                    updateErrorMap({
                      ...errorMap,
                      [taskField.value.name]: _.omit(thisTaskError, 'paramsMissingDefaults'),
                    });
                  }
                }}
              />
            );
          })}
        </>
      )}

      {inputResources && (
        <>
          <h2>Input Resources</h2>
          {inputResources && inputResources.map(renderResource('inputs'))}
        </>
      )}
      {outputResources && (
        <>
          <h2>Output Resources</h2>
          {outputResources && outputResources.map(renderResource('outputs'))}
        </>
      )}
    </div>
  );
};

export default TaskSidebar;
