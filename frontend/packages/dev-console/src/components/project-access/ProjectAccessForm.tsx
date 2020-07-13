import * as React from 'react';
import * as _ from 'lodash';
import { Form, TextInputTypes } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { MultiColumnField, InputField, DropdownField, FormFooter } from '@console/shared';

enum accessRoles {
  '' = 'Select a role',
  admin = 'Admin',
  edit = 'Edit',
  view = 'View',
}

const ProjectAccessForm: React.FC<FormikProps<FormikValues>> = ({
  handleSubmit,
  handleReset,
  isSubmitting,
  status,
  errors,
  dirty,
}) => (
  <Form onSubmit={handleSubmit}>
    <div className="co-m-pane__form">
      <MultiColumnField
        name="projectAccess"
        headers={['Name', 'Role']}
        emptyValues={{ user: '', role: '' }}
      >
        <InputField name="user" type={TextInputTypes.text} placeholder="Name" />
        <DropdownField name="role" items={accessRoles} fullWidth />
      </MultiColumnField>
      <hr />
      <FormFooter
        handleReset={handleReset}
        isSubmitting={isSubmitting}
        errorMessage={status && status.submitError}
        successMessage={status && !dirty && status.success}
        disableSubmit={!dirty || !_.isEmpty(errors)}
        showAlert={dirty}
      />
    </div>
  </Form>
);

export default ProjectAccessForm;
