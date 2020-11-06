import * as React from 'react';
import { useFormikContext } from 'formik';
import { TextInputTypes } from '@patternfly/react-core';
import { InputField } from '@console/shared';
import { PipelineParameters, PipelineResources } from '../detail-page-tabs';
import PipelineBuilderVisualization from './PipelineBuilderVisualization';
import {
  PipelineBuilderFormikValues,
  PipelineBuilderTaskGroup,
  SelectTaskCallback,
  UpdateTasksCallback,
} from './types';

import './PipelineBuilderForm.scss';

type PipelineBuilderFormEditorProps = {
  namespace: string;
  hasExistingPipeline: boolean;
  taskGroup: PipelineBuilderTaskGroup;
  onTaskSelection: SelectTaskCallback;
  onUpdateTasks: UpdateTasksCallback;
};

const PipelineBuilderFormEditor: React.FC<PipelineBuilderFormEditorProps> = (props) => {
  const { namespace, hasExistingPipeline, taskGroup, onTaskSelection, onUpdateTasks } = props;
  const { status } = useFormikContext<PipelineBuilderFormikValues>();

  return (
    <>
      <div className="odc-pipeline-builder-form__short-section">
        <InputField
          label="Name"
          name="formData.name"
          type={TextInputTypes.text}
          isDisabled={hasExistingPipeline}
          required
        />
      </div>

      <div>
        <h2>Tasks</h2>
        <PipelineBuilderVisualization
          namespace={namespace}
          tasksInError={status?.tasks || {}}
          onTaskSelection={onTaskSelection}
          onUpdateTasks={onUpdateTasks}
          taskGroup={taskGroup}
        />
      </div>

      <div>
        <h2>Parameters</h2>
        <PipelineParameters addLabel="Add Parameters" fieldName="formData.params" />
      </div>

      <div>
        <h2>Resources</h2>
        <PipelineResources addLabel="Add Resources" fieldName="formData.resources" />
      </div>
    </>
  );
};

export default PipelineBuilderFormEditor;
