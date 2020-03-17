import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps } from 'formik';
import { Form, Stack, StackItem, TextInputTypes } from '@patternfly/react-core';
import { FormFooter, InputField, useFormikValidationFix } from '@console/shared';
import { Pipeline } from '../../../utils/pipeline-augment';
import { PipelineParameters, PipelineResources } from '../detail-page-tabs';
import { UpdateOperationType } from './const';
import { useSmartLoadTasks } from './hooks';
import { removeTaskModal } from './modals';
import PipelineBuilderHeader from './PipelineBuilderHeader';
import PipelineBuilderVisualization from './PipelineBuilderVisualization';
import Sidebar from './task-sidebar/Sidebar';
import TaskSidebar from './task-sidebar/TaskSidebar';
import {
  CleanupResults,
  PipelineBuilderFormikValues,
  PipelineBuilderTaskGroup,
  ResourceTaskStatus,
  SelectedBuilderTask,
  TaskErrorList,
} from './types';
import { applyChange } from './update-utils';

import './PipelineBuilderForm.scss';

type PipelineBuilderFormProps = FormikProps<PipelineBuilderFormikValues> & {
  existingPipeline: Pipeline;
  namespace: string;
};

const PipelineBuilderForm: React.FC<PipelineBuilderFormProps> = (props) => {
  const {
    dirty,
    errors,
    existingPipeline,
    isSubmitting,
    handleReset,
    handleSubmit,
    namespace,
    setFieldValue,
    setStatus,
    status,
    values,
  } = props;
  useFormikValidationFix(values);

  const [selectedTask, setSelectedTask] = React.useState<SelectedBuilderTask>(null);
  const selectedTaskRef = React.useRef<SelectedBuilderTask>(null);
  selectedTaskRef.current = selectedTask;

  const resourceTasks: ResourceTaskStatus = {
    namespacedTasks: values.namespacedTasks,
    clusterTasks: values.clusterTasks,
    errorMsg: status?.taskLoadError,
  };
  useSmartLoadTasks(
    resourceTasks,
    namespace,
    setFieldValue,
    setStatus,
    !!existingPipeline,
    values.tasks,
  );

  const updateTasks = (changes: CleanupResults): void => {
    const { tasks, listTasks } = changes;

    setFieldValue('tasks', tasks);
    setFieldValue('listTasks', listTasks);
  };

  const selectedId = values.tasks[selectedTask?.taskIndex]?.name;
  const selectedIds = selectedId ? [selectedId] : [];

  const taskGroup: PipelineBuilderTaskGroup = {
    tasks: values.tasks,
    listTasks: values.listTasks,
    highlightedIds: selectedIds,
  };

  const closeSidebarAndHandleReset = React.useCallback(() => {
    setSelectedTask(null);
    selectedTaskRef.current = null;
    handleReset();
  }, [handleReset]);

  return (
    <>
      <Stack className="odc-pipeline-builder-form">
        <StackItem>
          <PipelineBuilderHeader existingPipeline={existingPipeline} namespace={namespace} />
        </StackItem>
        <StackItem isFilled className="odc-pipeline-builder-form__content">
          <Form className="odc-pipeline-builder-form__grid" onSubmit={handleSubmit}>
            <div className="odc-pipeline-builder-form__short-section">
              <InputField
                label="Name"
                name="name"
                type={TextInputTypes.text}
                isDisabled={!!existingPipeline}
                required
              />
            </div>

            <div>
              <h2>Tasks</h2>
              <PipelineBuilderVisualization
                namespace={namespace}
                tasksInError={(errors?.tasks as TaskErrorList) || []}
                onTaskSelection={(task, resource) => {
                  setSelectedTask({
                    taskIndex: values.tasks.findIndex(({ name }) => name === task.name),
                    resource,
                  });
                }}
                onUpdateTasks={(updatedTaskGroup, op) =>
                  updateTasks(applyChange(updatedTaskGroup, op))
                }
                resourceTasks={resourceTasks}
                taskGroup={taskGroup}
              />
            </div>

            <div>
              <h2>Parameters</h2>
              <PipelineParameters addLabel="Add Parameters" fieldName="params" />
            </div>

            <div>
              <h2>Resources</h2>
              <PipelineResources addLabel="Add Resources" fieldName="resources" />
            </div>
            <FormFooter
              handleReset={closeSidebarAndHandleReset}
              errorMessage={status?.submitError}
              isSubmitting={isSubmitting}
              submitLabel={existingPipeline ? 'Save' : 'Create'}
              disableSubmit={
                !dirty ||
                !_.isEmpty(errors) ||
                !_.isEmpty(status?.tasks) ||
                values.tasks.length === 0
              }
              resetLabel="Cancel"
              sticky
            />
          </Form>
        </StackItem>
      </Stack>
      <Sidebar
        open={!!selectedTask}
        onRequestClose={() => {
          if (selectedTask?.taskIndex === selectedTaskRef.current?.taskIndex) {
            setSelectedTask(null);
          }
        }}
      >
        {() => (
          <div className="pf-c-form">
            <TaskSidebar
              // Intentional remount when selection changes
              key={selectedTask.taskIndex}
              resourceList={values.resources || []}
              onNameUpdate={(data) => {
                updateTasks(
                  applyChange(taskGroup, { type: UpdateOperationType.UPDATE_TASK, data }),
                );
              }}
              onRemoveTask={(taskName) => {
                removeTaskModal(taskName, () => {
                  setSelectedTask(null);
                  updateTasks(
                    applyChange(taskGroup, {
                      type: UpdateOperationType.REMOVE_TASK,
                      data: { taskName },
                    }),
                  );
                });
              }}
              selectedPipelineTaskIndex={selectedTask.taskIndex}
              taskResource={selectedTask.resource}
            />
          </div>
        )}
      </Sidebar>
    </>
  );
};

export default PipelineBuilderForm;
