import * as React from 'react';
import * as _ from 'lodash';
import { Form, TextInputTypes } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { useAccessReview } from '@console/internal/components/utils';
import { getActiveNamespace } from '@console/internal/actions/ui';
import {
  MultiColumnField,
  InputField,
  DropdownField,
} from '@console/shared/src/components/formik-fields';
import { FormFooter } from '../../form-utils';

enum resourceTypes {
  '' = 'Select resource type',
  git = 'Git',
  image = 'Image',
  cluster = 'Cluster',
  storage = 'Storage',
}

const PipelineResources: React.FC<FormikProps<FormikValues>> = ({
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
        <MultiColumnField
          name="resources"
          addLabel="Add Pipeline Resources"
          headers={['Name', 'Resource Type']}
          emptyValues={{ name: '', type: '' }}
          isReadOnly={!pipelineResourceAccess}
        >
          <InputField
            name="name"
            type={TextInputTypes.text}
            placeholder="Name"
            isReadOnly={!pipelineResourceAccess}
          />
          <DropdownField
            name="type"
            items={resourceTypes}
            fullWidth
            disabled={!pipelineResourceAccess}
          />
        </MultiColumnField>
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

export default PipelineResources;
