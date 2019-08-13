import * as React from 'react';
import {
  Form,
  Button,
  ButtonVariant,
  Alert,
  TextInputTypes,
  ActionGroup,
} from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { ButtonBar } from '@console/internal/components/utils';
import { MultiColumnField, InputField } from '../formik-fields';

const PipelineParameters: React.FC<FormikProps<FormikValues>> = ({
  handleSubmit,
  handleReset,
  isSubmitting,
  status,
  errors,
  dirty,
}) => {
  return (
    <Form onSubmit={handleSubmit}>
      <div className="co-m-pane__form">
        <MultiColumnField
          name="parameters"
          addLabel="Add Pipeline Params"
          headers={['Name', 'Description', 'Default Value']}
          emptyValues={{ name: '', description: '', default: '' }}
        >
          <InputField name="name" type={TextInputTypes.text} placeholder="Name" />
          <InputField name="description" type={TextInputTypes.text} placeholder="Description" />
          <InputField name="default" type={TextInputTypes.text} placeholder="Default Value" />
        </MultiColumnField>
        <hr />
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
              isDisabled={!dirty || !!errors.parameters}
            >
              Save
            </Button>
            <Button type="button" variant={ButtonVariant.secondary} onClick={handleReset}>
              Reload
            </Button>
          </ActionGroup>
        </ButtonBar>
      </div>
    </Form>
  );
};

export default PipelineParameters;
