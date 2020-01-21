import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, FormikValues } from 'formik';
import { Form, ActionGroup, Button, ButtonVariant, TextInputTypes } from '@patternfly/react-core';
import { ButtonBar } from '@console/internal/components/utils';
import { InputField } from '@console/shared';
import { PipelineTask } from '../../../utils/pipeline-augment';
import { PipelineParameters, PipelineResources } from '../detail-page-tabs';
import PipelineBuilderVisualization from './PipelineBuilderVisualization';

import './PipelineBuilderForm.scss';

type PipelineBuilderFormProps = FormikProps<FormikValues> & {
  namespace: string;
};

const PipelineBuilderForm: React.FC<PipelineBuilderFormProps> = (props) => {
  const {
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
      <div className="odc-pipeline-builder-form__short-section">
        <InputField label="Name" name="name" type={TextInputTypes.text} />
      </div>

      <div>
        <h2>Tasks</h2>
        <PipelineBuilderVisualization
          namespace={namespace}
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
            isDisabled={!dirty || !_.isEmpty(errors)}
            data-test-id="import-git-create-button"
          >
            Create
          </Button>
          <Button type="button" variant={ButtonVariant.secondary} onClick={handleReset}>
            Cancel
          </Button>
        </ActionGroup>
      </ButtonBar>
    </Form>
  );
};

export default PipelineBuilderForm;
