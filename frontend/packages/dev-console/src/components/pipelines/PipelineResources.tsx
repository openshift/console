import * as React from 'react';
import {
  Form,
  Button,
  Alert,
  TextInputTypes,
  ActionGroup,
  ButtonVariant,
} from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { ButtonBar, useAccessReview } from '@console/internal/components/utils';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { MultiColumnField, InputField, DropdownField } from '../formik-fields';

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
          <ButtonBar
            inProgress={isSubmitting}
            errorMessage={status && status.submitError}
            successMessage={status && status.success}
          >
            {!status && dirty && (
              <Alert
                isInline
                className="co-alert"
                variant="info"
                title="The information on this page is no longer current."
              >
                Click Reload to update and lose edits, or Save Changes to overwrite.
              </Alert>
            )}
            <ActionGroup className="pf-c-form">
              <Button
                type="submit"
                variant={ButtonVariant.primary}
                isDisabled={!dirty || !!errors.resources}
              >
                Save
              </Button>
              <Button type="button" variant={ButtonVariant.secondary} onClick={handleReset}>
                Reload
              </Button>
            </ActionGroup>
          </ButtonBar>
        )}
      </div>
    </Form>
  );
};

export default PipelineResources;
