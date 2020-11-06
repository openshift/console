import * as React from 'react';
import { useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { namespace, hasExistingPipeline, taskGroup, onTaskSelection, onUpdateTasks } = props;
  const { status } = useFormikContext<PipelineBuilderFormikValues>();

  return (
    <>
      <div className="odc-pipeline-builder-form__short-section">
        <InputField
          label={t('pipelines-plugin~Name')}
          name="formData.name"
          type={TextInputTypes.text}
          isDisabled={hasExistingPipeline}
          required
        />
      </div>

      <div>
        <h2>{t('pipelines-plugin~Tasks')}</h2>
        <PipelineBuilderVisualization
          namespace={namespace}
          tasksInError={status?.tasks || {}}
          onTaskSelection={onTaskSelection}
          onUpdateTasks={onUpdateTasks}
          taskGroup={taskGroup}
        />
      </div>

      <div>
        <h2>{t('pipelines-plugin~Parameters')}</h2>
        <PipelineParameters
          addLabel={t('pipelines-plugin~Add Parameters')}
          fieldName="formData.params"
        />
      </div>

      <div>
        <h2>{t('pipelines-plugin~Resources')}</h2>
        <PipelineResources
          addLabel={t('pipelines-plugin~Add Resources')}
          fieldName="formData.resources"
        />
      </div>
    </>
  );
};

export default PipelineBuilderFormEditor;
