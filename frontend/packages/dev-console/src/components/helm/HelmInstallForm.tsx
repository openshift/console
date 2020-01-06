import * as React from 'react';
import * as _ from 'lodash';
import { Form, ActionGroup, ButtonVariant, Button, TextInputTypes } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { ButtonBar } from '@console/internal/components/utils';
import { InputField } from '@console/shared';
import FormSection from '../import/section/FormSection';

const HelmInstallForm: React.FC<FormikProps<FormikValues>> = ({
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
  dirty,
}) => (
  <Form onSubmit={handleSubmit}>
    <FormSection title="General">
      <InputField
        type={TextInputTypes.text}
        name="releaseName"
        label="Release Name"
        helpText="A unique name for the Helm Chart release."
        required
      />
    </FormSection>
    <ButtonBar errorMessage={status && status.submitError} inProgress={isSubmitting}>
      <ActionGroup className="pf-c-form">
        <Button
          type="submit"
          variant={ButtonVariant.primary}
          isDisabled={!dirty || !_.isEmpty(errors)}
          data-test-id="helm-install-create-button"
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

export default HelmInstallForm;
