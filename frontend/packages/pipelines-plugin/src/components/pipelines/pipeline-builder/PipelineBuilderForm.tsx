import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps } from 'formik';
import { useTranslation } from 'react-i18next';
import { Stack, StackItem } from '@patternfly/react-core';
import { FormFooter, SyncedEditorField, YAMLEditorField, FlexForm } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { Pipeline, PipelineResourceTask } from '../../../utils/pipeline-augment';
import { PipelineVisualizationTaskItem } from '../../../utils/pipeline-utils';
import { PipelineModel } from '../../../models';
import { useResourceValidation } from './hooks';
import { removeTaskModal } from './modals';
import PipelineBuilderHeader from './PipelineBuilderHeader';
import Sidebar from './task-sidebar/Sidebar';
import TaskSidebar from './task-sidebar/TaskSidebar';
import {
  CleanupResults,
  PipelineBuilderTaskGroup,
  SelectedBuilderTask,
  UpdateErrors,
  UpdateOperationUpdateTaskData,
  PipelineBuilderFormikValues,
} from './types';
import { applyChange } from './update-utils';
import { convertBuilderFormToPipeline } from './utils';
import { initialPipelineFormData, UpdateOperationType } from './const';
import PipelineBuilderFormEditor from './PipelineBuilderFormEditor';

import './PipelineBuilderForm.scss';

type PipelineBuilderFormProps = FormikProps<PipelineBuilderFormikValues> & {
  existingPipeline: Pipeline;
  namespace: string;
};

const PipelineBuilderForm: React.FC<PipelineBuilderFormProps> = (props) => {
  const { t } = useTranslation();
  const [selectedTask, setSelectedTask] = React.useState<SelectedBuilderTask>(null);
  const selectedTaskRef = React.useRef<SelectedBuilderTask>(null);
  selectedTaskRef.current = selectedTask;

  const {
    existingPipeline,
    status,
    isSubmitting,
    dirty,
    handleReset,
    handleSubmit,
    errors,
    namespace,
    setFieldValue,
    setStatus,
    values,
    validateForm,
  } = props;
  const statusRef = React.useRef(status);
  statusRef.current = status;

  React.useEffect(() => {
    if (values.editorType === EditorType.Form) {
      // Force validation against the new data that was adjusted in the YAML
      // Formik isn't properly handling the immediate state of the form values during the cycle of the editorType
      setTimeout(() => validateForm(), 0);
    }
  }, [values.editorType, validateForm]);

  const updateErrors: UpdateErrors = React.useCallback(
    (taskErrors) => {
      if (taskErrors) {
        setStatus({
          ...statusRef.current,
          tasks: _.omitBy(_.merge({}, statusRef.current?.tasks, taskErrors), (v) => !v),
        });
      }
    },
    [setStatus],
  );

  const onTaskSelection = (task: PipelineVisualizationTaskItem, resource: PipelineResourceTask) => {
    setSelectedTask({
      taskIndex: values.formData.tasks.findIndex(({ name }) => name === task.name),
      resource,
    });
  };

  useResourceValidation(values.formData.tasks, values.formData.resources, updateErrors);

  const updateTasks = (changes: CleanupResults): void => {
    const { tasks, listTasks, errors: taskErrors } = changes;

    setFieldValue('formData.tasks', tasks);
    setFieldValue('formData.listTasks', listTasks);
    updateErrors(taskErrors);
  };

  const selectedId = values.formData.tasks[selectedTask?.taskIndex]?.name;
  const selectedIds = selectedId ? [selectedId] : [];

  const taskGroup: PipelineBuilderTaskGroup = {
    tasks: values.formData.tasks,
    listTasks: values.formData.listTasks,
    highlightedIds: selectedIds,
  };

  const closeSidebarAndHandleReset = React.useCallback(() => {
    setSelectedTask(null);
    selectedTaskRef.current = null;
    handleReset();
  }, [handleReset]);

  const formEditor = (
    <PipelineBuilderFormEditor
      namespace={namespace}
      hasExistingPipeline={!!existingPipeline}
      taskGroup={taskGroup}
      onTaskSelection={onTaskSelection}
      onUpdateTasks={(updatedTaskGroup, op) => {
        updateTasks(applyChange(updatedTaskGroup, op));
      }}
    />
  );

  const yamlEditor = (
    <YAMLEditorField name="yamlData" model={PipelineModel} onSave={handleSubmit} />
  );

  const sanitizeToForm = (newFormData: Pipeline) => {
    const formData = {
      ...newFormData.spec,
      name: newFormData.metadata?.name,
      listTasks: values.formData.listTasks,
    };
    return _.merge({}, initialPipelineFormData, formData);
  };

  const sanitizeToYaml = () =>
    safeJSToYAML(
      convertBuilderFormToPipeline(values.formData, namespace, existingPipeline),
      'yamlData',
      {
        skipInvalid: true,
      },
    );

  return (
    <>
      <Stack className="odc-pipeline-builder-form">
        <StackItem>
          <PipelineBuilderHeader />
        </StackItem>
        <FlexForm className="odc-pipeline-builder-form__grid" onSubmit={handleSubmit}>
          <SyncedEditorField
            name="editorType"
            formContext={{
              name: 'formData',
              editor: formEditor,
              label: t('pipelines-plugin~Pipeline builder'),
              sanitizeTo: sanitizeToForm,
            }}
            yamlContext={{ name: 'yamlData', editor: yamlEditor, sanitizeTo: sanitizeToYaml }}
          />
          <FormFooter
            handleReset={closeSidebarAndHandleReset}
            errorMessage={status?.submitError}
            isSubmitting={isSubmitting}
            submitLabel={
              existingPipeline ? t('pipelines-plugin~Save') : t('pipelines-plugin~Create')
            }
            disableSubmit={
              values.editorType === EditorType.YAML
                ? !dirty
                : !dirty ||
                  !_.isEmpty(errors) ||
                  !_.isEmpty(status?.tasks) ||
                  values.formData.tasks.length === 0
            }
            resetLabel={t('pipelines-plugin~Cancel')}
            sticky
          />
        </FlexForm>
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
              resourceList={values.formData.resources || []}
              errorMap={status?.tasks || {}}
              onUpdateTask={(data: UpdateOperationUpdateTaskData) => {
                updateTasks(
                  applyChange(taskGroup, { type: UpdateOperationType.UPDATE_TASK, data }),
                );
              }}
              onRemoveTask={(taskName) => {
                removeTaskModal(
                  taskName,
                  () => {
                    setSelectedTask(null);
                    updateTasks(
                      applyChange(taskGroup, {
                        type: UpdateOperationType.REMOVE_TASK,
                        data: { taskName },
                      }),
                    );
                  },
                  t,
                );
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
