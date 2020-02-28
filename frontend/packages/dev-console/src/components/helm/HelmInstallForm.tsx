import * as React from 'react';
import * as _ from 'lodash';
import { Form, TextInputTypes } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { InputField, FormFooter, YAMLEditorField } from '@console/shared';
import FormSection from '../import/section/FormSection';

const HelmInstallForm: React.FC<FormikProps<FormikValues>> = ({
  errors,
  handleSubmit,
  handleReset,
  status,
  isSubmitting,
}) => (
  <Form onSubmit={handleSubmit}>
    <FormSection>
      <InputField
        type={TextInputTypes.text}
        name="releaseName"
        label="Release Name"
        helpText="A unique name for the Helm Chart release."
        required
      />
      <YAMLEditorField name="valuesYAML" />
    </FormSection>
    <FormFooter
      handleReset={handleReset}
      errorMessage={status && status.submitError}
      isSubmitting={isSubmitting}
      submitLabel="Install"
      disableSubmit={!_.isEmpty(errors)}
      resetLabel="Cancel"
    />
  </Form>
);

export default HelmInstallForm;
