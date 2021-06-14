import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import { FormikProps } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  FormFooter,
  SyncedEditorField,
  YAMLEditorField,
  FlexForm,
  FormBody,
} from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { PipelineModel } from '../../../models';
import { PipelineKind, PipelineTask, TaskKind } from '../../../types';
import { initialPipelineFormData, UpdateOperationType } from './const';
import { useExplicitPipelineTaskTouch, useFormikFetchAndSaveTasks } from './hooks';
import { removeTaskModal } from './modals';
import PipelineBuilderFormEditor from './PipelineBuilderFormEditor';
import PipelineBuilderHeader from './PipelineBuilderHeader';
import Sidebar from './task-sidebar/Sidebar';
import TaskSidebar from './task-sidebar/TaskSidebar';
import {
  CleanupResults,
  PipelineBuilderTaskGroup,
  SelectedBuilderTask,
  UpdateOperationRenameTaskData,
  PipelineBuilderFormikValues,
  TaskType,
} from './types';
import { applyChange } from './update-utils';
import { convertBuilderFormToPipeline } from './utils';

import './PipelineBuilderForm.scss';

type PipelineBuilderFormProps = FormikProps<PipelineBuilderFormikValues> & {
  existingPipeline: PipelineKind;
  namespace: string;
};

const PipelineBuilderForm: React.FC<PipelineBuilderFormProps> = (props) => {
  const { t } = useTranslation();
  const [selectedTask, setSelectedTask] = React.useState<SelectedBuilderTask>(null);
  const selectedTaskRef = React.useRef<SelectedBuilderTask>(null);
  selectedTaskRef.current = selectedTask;
  const contentRef = React.useRef<HTMLDivElement>(null);

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
    values: { editorType, formData, taskResources },
    validateForm,
  } = props;
  useFormikFetchAndSaveTasks(namespace, validateForm);
  useExplicitPipelineTaskTouch();

  const statusRef = React.useRef(status);
  statusRef.current = status;

  const onTaskSelection = (task: PipelineTask, resource: TaskKind, isFinallyTask: boolean) => {
    const builderNodes = isFinallyTask ? formData.finallyTasks : formData.tasks;
    setSelectedTask({
      isFinallyTask,
      taskIndex: builderNodes.findIndex(({ name }) => name === task.name),
      resource,
    });
  };

  const updateTasks = (changes: CleanupResults): void => {
    const { tasks, listTasks, finallyTasks, finallyListTasks } = changes;

    setFieldValue('formData', {
      ...formData,
      tasks,
      listTasks,
      finallyTasks,
      finallyListTasks,
    });
  };

  const nodeType: TaskType = selectedTask?.isFinallyTask ? 'finallyTasks' : 'tasks';
  const selectedId = formData[nodeType][selectedTask?.taskIndex]?.name;
  const selectedIds = selectedId ? [selectedId] : [];

  const taskGroup: PipelineBuilderTaskGroup = {
    tasks: formData.tasks,
    listTasks: formData.listTasks,
    highlightedIds: selectedIds,
    finallyTasks: formData.finallyTasks,
    finallyListTasks: formData.finallyListTasks,
  };

  const closeSidebarAndHandleReset = React.useCallback(() => {
    setSelectedTask(null);
    selectedTaskRef.current = null;
    handleReset();
  }, [handleReset]);

  const formEditor = (
    <PipelineBuilderFormEditor
      hasExistingPipeline={!!existingPipeline}
      taskGroup={taskGroup}
      taskResources={taskResources}
      onTaskSelection={onTaskSelection}
      onUpdateTasks={(updatedTaskGroup, op) => {
        updateTasks(applyChange(updatedTaskGroup, op));
      }}
    />
  );

  const yamlEditor = (
    <YAMLEditorField name="yamlData" model={PipelineModel} onSave={handleSubmit} />
  );

  const sanitizeToForm = (yamlPipeline: PipelineKind) => {
    const { finally: finallyTasks, ...pipelineSpecProperties } = yamlPipeline.spec;

    const newFormData = {
      ...formData,
      ...pipelineSpecProperties, // support & keep unknown values as well as whatever they may have changed that we use
      name: yamlPipeline.metadata?.name,
      finallyTasks,
    };
    return _.merge({}, initialPipelineFormData, newFormData);
  };

  const sanitizeToYaml = () =>
    safeJSToYAML(convertBuilderFormToPipeline(formData, namespace, existingPipeline), 'yamlData', {
      skipInvalid: true,
    });

  return (
    <>
      <div ref={contentRef} className="odc-pipeline-builder-form">
        <Stack>
          <StackItem>
            <PipelineBuilderHeader namespace={namespace} />
          </StackItem>
          <FlexForm onSubmit={handleSubmit}>
            <FormBody flexLayout disablePaneBody className="odc-pipeline-builder-form__grid">
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
            </FormBody>
            <FormFooter
              handleReset={closeSidebarAndHandleReset}
              errorMessage={status?.submitError}
              isSubmitting={isSubmitting}
              submitLabel={
                existingPipeline ? t('pipelines-plugin~Save') : t('pipelines-plugin~Create')
              }
              disableSubmit={
                editorType === EditorType.YAML
                  ? !dirty
                  : !dirty ||
                    !_.isEmpty(errors) ||
                    !_.isEmpty(status?.tasks) ||
                    formData.tasks.length === 0
              }
              resetLabel={t('pipelines-plugin~Cancel')}
              sticky
            />
          </FlexForm>
        </Stack>
      </div>
      <Sidebar
        closeAreaNode={contentRef.current}
        open={!!selectedTask}
        onRequestClose={() => {
          const currentSelection: SelectedBuilderTask = selectedTaskRef.current;
          setTimeout(() => {
            if (
              currentSelection?.taskIndex === selectedTaskRef.current?.taskIndex &&
              currentSelection?.isFinallyTask === selectedTaskRef.current?.isFinallyTask
            ) {
              // Clicked on itself or on a non-node
              setSelectedTask(null);
            }
          }, 0); // let the click logic flow through
        }}
      >
        {() => (
          <TaskSidebar
            // Intentional remount when selection changes
            key={selectedTask.taskIndex}
            onClose={() => setSelectedTask(null)}
            resourceList={formData.resources || []}
            workspaceList={formData.workspaces || []}
            errorMap={status?.tasks || {}}
            onRenameTask={(data: UpdateOperationRenameTaskData) => {
              updateTasks(applyChange(taskGroup, { type: UpdateOperationType.RENAME_TASK, data }));
            }}
            onRemoveTask={(taskName: string) => {
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
            selectedData={selectedTask}
          />
        )}
      </Sidebar>
    </>
  );
};

export default PipelineBuilderForm;
