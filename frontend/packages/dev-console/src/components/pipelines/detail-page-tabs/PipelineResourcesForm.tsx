import * as React from 'react';
import * as _ from 'lodash';
import { Form } from '@patternfly/react-core';
import { FormikProps, FormikValues, getIn } from 'formik';
import { useAccessReview } from '@console/internal/components/utils';
import { FormFooter } from '@console/shared';
import PipelineResources from './PipelineResources';

type PipelineResourcesFormProps = FormikProps<FormikValues> & {
  namespace: string;
};

const PipelineResourcesForm: React.FC<PipelineResourcesFormProps> = ({
  namespace,
  handleSubmit,
  handleReset,
  isSubmitting,
  status,
  errors,
  dirty,
}) => {
  const pipelineResourceAccess = useAccessReview({
    group: 'tekton.dev',
    resource: 'pipelines',
    namespace,
    verb: 'update',
  });
  return (
    <Form onSubmit={handleSubmit}>
      <div className="co-m-pane__form">
        <PipelineResources fieldName="resources" isReadOnly={!pipelineResourceAccess} />
        <hr />
        {pipelineResourceAccess && (
          <FormFooter
            handleReset={handleReset}
            isSubmitting={isSubmitting}
            errorMessage={status && status.submitError}
            successMessage={status && !dirty && status.success}
            disableSubmit={!dirty || !_.isEmpty(_.compact(getIn(errors, 'resources')))}
            showAlert={dirty}
          />
        )}
      </div>
    </Form>
  );
};

export default PipelineResourcesForm;
