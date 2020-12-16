import * as React from 'react';
import * as _ from 'lodash';
import { Form } from '@patternfly/react-core';
import { FormikProps, FormikValues, getIn } from 'formik';
import { useAccessReview } from '@console/internal/components/utils';
import { FormFooter } from '@console/shared';
import PipelineParameters from './PipelineParameters';

type PipelineParametersFormProps = FormikProps<FormikValues> & {
  namespace: string;
};

const PipelineParametersForm: React.FC<PipelineParametersFormProps> = ({
  namespace,
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
    namespace,
    verb: 'update',
  });
  return (
    <Form onSubmit={handleSubmit}>
      <div className="co-m-pane__form">
        <PipelineParameters fieldName="parameters" isReadOnly={!pipelineParameterAccess} />
        <hr />
        {pipelineParameterAccess && (
          <FormFooter
            handleReset={handleReset}
            isSubmitting={isSubmitting}
            errorMessage={status && status.submitError}
            successMessage={status && !dirty && status.success}
            disableSubmit={!dirty || !_.isEmpty(_.compact(getIn(errors, 'parameters')))}
            showAlert={dirty}
          />
        )}
      </div>
    </Form>
  );
};

export default PipelineParametersForm;
