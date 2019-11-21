import * as React from 'react';
import * as _ from 'lodash';
import { Form, TextInputTypes } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { useAccessReview } from '@console/internal/components/utils';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { MultiColumnField, InputField } from '@console/shared/src/components/formik-fields';
import { FormFooter } from '../../form-utils';

const PipelineParameters: React.FC<FormikProps<FormikValues>> = ({
  handleSubmit,
  handleReset,
  isSubmitting,
  status,
  errors,
  dirty,
}) => {
  const pipelineParameterAccess = useAccessReview({
    group: 'tekton.dev',
    resource: 'pipelines',
    namespace: getActiveNamespace(),
    verb: 'update',
  });
  return (
    <Form onSubmit={handleSubmit}>
      <div className="co-m-pane__form">
        <MultiColumnField
          name="parameters"
          addLabel="Add Pipeline Params"
          headers={['Name', 'Description', 'Default Value']}
          emptyValues={{ name: '', description: '', default: '' }}
          isReadOnly={!pipelineParameterAccess}
        >
          <InputField
            name="name"
            type={TextInputTypes.text}
            placeholder="Name"
            isReadOnly={!pipelineParameterAccess}
          />
          <InputField
            name="description"
            type={TextInputTypes.text}
            placeholder="Description"
            isReadOnly={!pipelineParameterAccess}
          />
          <InputField
            name="default"
            type={TextInputTypes.text}
            placeholder="Default Value"
            isReadOnly={!pipelineParameterAccess}
          />
        </MultiColumnField>
        <hr />
        {pipelineParameterAccess && (
          <FormFooter
            handleReset={handleReset}
            isSubmitting={isSubmitting}
            errorMessage={status && status.submitError}
            successMessage={status && !dirty && status.success}
            disableSubmit={!dirty || !_.isEmpty(errors)}
            showAlert={dirty}
          />
        )}
      </div>
    </Form>
  );
};

export default PipelineParameters;
