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
import { PipelineModel } from '../../../models';
import { PipelineKind, PipelineTask, TaskKind } from '../../../types';
import PipelineQuickSearch from '../../quicksearch/PipelineQuickSearch';
import { STATUS_KEY_NAME_ERROR, UpdateOperationType } from './const';
import { sanitizeToForm, sanitizeToYaml } from './form-switcher-validation';
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
  TaskSearchCallback,
} from './types';
import { applyChange } from './update-utils';

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
  const [menuOpen, setMenuOpen] = React.useState<boolean>(false);
  const savedCallback = React.useRef(() => {});

  statusRef.current = status;

  const onTaskSearch: TaskSearchCallback = (callback: () => void): void => {
    setMenuOpen(true);
    savedCallback.current = callback;
  };
  const onTaskSelection = (task: PipelineTask, resource: TaskKind, isFinallyTask: boolean) => {
    const builderNodes = isFinallyTask ? formData.finallyTasks : formData.tasks;
    setSelectedTask({
      isFinallyTask,
      taskIndex: builderNodes.findIndex(({ name }) => name === task.name),
      resource,
    });
  };

  const updateTasks = (changes: CleanupResults): void => {
    const { tasks, listTasks, finallyTasks, finallyListTasks, loadingTasks } = changes;

    setFieldValue('formData', {
      ...formData,
      tasks,
      listTasks,
      loadingTasks,
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
    loadingTasks: formData.loadingTasks,
    highlightedIds: selectedIds,
    finallyTasks: formData.finallyTasks,
    finallyListTasks: formData.finallyListTasks,
  };

  const onUpdateTasks = (updatedTaskGroup, op) => {
    updateTasks(applyChange(updatedTaskGroup, op));
  };

  const closeSidebarAndHandleReset = React.useCallback(() => {
    setSelectedTask(null);
    selectedTaskRef.current = null;
    handleReset();
  }, [handleReset]);

  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'pipeline.pipelineBuilderForm.editor.lastView';

  const formEditor = (
    <PipelineBuilderFormEditor
      hasExistingPipeline={!!existingPipeline}
      taskGroup={taskGroup}
      taskResources={taskResources}
      onTaskSelection={onTaskSelection}
      onTaskSearch={onTaskSearch}
      onUpdateTasks={onUpdateTasks}
    />
  );

  const yamlEditor = (
    <YAMLEditorField
      name="yamlData"
      model={PipelineModel}
      showSamples={!existingPipeline}
      onSave={handleSubmit}
    />
  );

  return (
    <>
      <div
        ref={contentRef}
        className="odc-pipeline-builder-form ocs-quick-search-modal__no-backdrop"
      >
        <Stack>
          <StackItem>
            <PipelineBuilderHeader namespace={namespace} />
          </StackItem>
          <FlexForm onSubmit={handleSubmit}>
            <FormBody flexLayout disablePaneBody className="odc-pipeline-builder-form__grid">
              <PipelineQuickSearch
                namespace={namespace}
                viewContainer={contentRef.current}
                isOpen={menuOpen}
                callback={savedCallback.current}
                setIsOpen={(open) => setMenuOpen(open)}
                onUpdateTasks={onUpdateTasks}
                taskGroup={taskGroup}
              />
              <SyncedEditorField
                name="editorType"
                formContext={{
                  name: 'formData',
                  editor: formEditor,
                  label: t('pipelines-plugin~Pipeline builder'),
                  sanitizeTo: (yamlPipeline: PipelineKind) =>
                    sanitizeToForm(formData, yamlPipeline),
                }}
                yamlContext={{
                  name: 'yamlData',
                  editor: yamlEditor,
                  sanitizeTo: () => sanitizeToYaml(formData, namespace, existingPipeline),
                }}
                lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
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
                    !_.isEmpty(status?.[STATUS_KEY_NAME_ERROR]) ||
                    formData.tasks.length === 0 ||
                    formData.loadingTasks.length > 0
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
