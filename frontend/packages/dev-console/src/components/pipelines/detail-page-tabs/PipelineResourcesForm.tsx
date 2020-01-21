import * as React from 'react';
import * as _ from 'lodash';
import { Form } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { useAccessReview } from '@console/internal/components/utils';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { FormFooter } from '@console/shared';
import PipelineResources from './PipelineResources';

const PipelineResourcesForm: React.FC<FormikProps<FormikValues>> = ({
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
    namespace: getActiveNamespace(),
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
            disableSubmit={!dirty || !_.isEmpty(errors)}
            showAlert={dirty}
          />
        )}
      </div>
    </Form>
  );
};

export default PipelineResourcesForm;
