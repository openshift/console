import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { ActionGroup, Button, ButtonVariant, Form, TextInputTypes } from '@patternfly/react-core';
import { ButtonBar } from '@console/internal/components/utils';
import { InputField } from '@console/shared';
import { PipelineTask } from '../../../utils/pipeline-augment';
import { PipelineParameters, PipelineResources } from '../detail-page-tabs';
import { TASK_INCOMPLETE_ERROR_MESSAGE } from './const';
import { removeTaskModal } from './modals';
import PipelineBuilderVisualization from './PipelineBuilderVisualization';
import Sidebar from './task-sidebar/Sidebar';
import TaskSidebar from './task-sidebar/TaskSidebar';
import { SelectedBuilderTask, TaskErrorMap } from './types';

import './PipelineBuilderForm.scss';

type PipelineBuilderFormProps = FormikProps<FormikValues> & {
  editingPipeline: boolean;
  namespace: string;
};

const pruneErrors = (taskErrors: TaskErrorMap): TaskErrorMap => {
  return Object.keys(taskErrors).reduce((newTaskMap, taskName) => {
    const taskValue = taskErrors[taskName];

    if (
      !taskValue.inputResourceCount &&
      !taskValue.outputResourceCount &&
      !taskValue.paramsMissingDefaults
    ) {
      return newTaskMap;
    }

    return {
      ...newTaskMap,
      [taskName]: taskValue,
    };
  }, {} as TaskErrorMap);
};

const PipelineBuilderForm: React.FC<PipelineBuilderFormProps> = (props) => {
  const [selectedTask, setSelectedTask] = React.useState<SelectedBuilderTask>(null);
  const [taskErrors, setTaskErrors] = React.useState<TaskErrorMap>({});

  const {
    editingPipeline,
    status,
    isSubmitting,
    dirty,
    handleReset,
    handleSubmit,
    errors,
    namespace,
    setFieldValue,
    values,
  } = props;

  return (
    <Form className="odc-pipeline-builder-form" onSubmit={handleSubmit}>
      <div className="odc-pipeline-builder-form__content">
        <div className="odc-pipeline-builder-form__short-section">
          <InputField
            label="Name"
            name="name"
            type={TextInputTypes.text}
            isDisabled={editingPipeline}
          />
        </div>

        <div>
          <h2>Tasks</h2>
          <PipelineBuilderVisualization
            namespace={namespace}
            tasksInError={taskErrors}
            onTaskSelection={(task, resource) => {
              setSelectedTask({
                taskIndex: values.tasks.findIndex(({ name }) => name === task.name),
                resource,
              });
            }}
            onSetError={(
              taskName,
              inputResourceCount,
              outputResourceCount,
              paramsMissingDefaults,
            ) => {
              setTaskErrors({
                ...taskErrors,
                [taskName]: {
                  inputResourceCount,
                  outputResourceCount,
                  paramsMissingDefaults,
                  message: TASK_INCOMPLETE_ERROR_MESSAGE,
                },
              });
            }}
            onUpdateTasks={(updatedTasks: PipelineTask[]) => setFieldValue('tasks', updatedTasks)}
            pipelineTasks={values.tasks}
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

        <ButtonBar errorMessage={status && status.submitError} inProgress={isSubmitting}>
          <ActionGroup className="pf-c-form">
            <Button
              type="submit"
              variant={ButtonVariant.primary}
              isDisabled={!dirty || !_.isEmpty(errors) || !_.isEmpty(taskErrors)}
              data-test-id="import-git-create-button"
            >
              {editingPipeline ? 'Save' : 'Create'}
            </Button>
            <Button type="button" variant={ButtonVariant.secondary} onClick={handleReset}>
              Cancel
            </Button>
          </ActionGroup>
        </ButtonBar>
      </div>
      <Sidebar open={!!selectedTask} onRequestClose={() => setSelectedTask(null)}>
        {() => (
          <TaskSidebar
            resourceList={values.resources || []}
            errorMap={taskErrors}
            updateErrorMap={(newTaskErrors) => setTaskErrors(pruneErrors(newTaskErrors))}
            setFieldValue={setFieldValue}
            onRemoveTask={(taskName) => {
              removeTaskModal(taskName, () => {
                setSelectedTask(null);
                setFieldValue(
                  'tasks',
                  values.tasks.filter((task) => task.name !== taskName),
                );
              });
            }}
            selectedPipelineTaskIndex={selectedTask.taskIndex}
            taskResource={selectedTask.resource}
          />
        )}
      </Sidebar>
    </Form>
  );
};

export default PipelineBuilderForm;
