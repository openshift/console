import * as React from 'react';
import * as _ from 'lodash';
import { Form, TextInputTypes } from '@patternfly/react-core';
import { FormikProps, FormikValues } from 'formik';
import { MultiColumnField, InputField, DropdownField, FormFooter } from '@console/shared';
import { useTranslation } from 'react-i18next';

enum accessRoles {
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
}) => {
  const { t } = useTranslation();
  const disableSubmit = !dirty || !_.isEmpty(errors);
  return (
    <Form onSubmit={handleSubmit}>
      <div className="co-m-pane__form">
        <MultiColumnField
          name="projectAccess"
          addLabel={t('devconsole~Add Access')}
          headers={[t('devconsole~Name'), t('devconsole~Role')]}
          emptyValues={{ user: '', role: '' }}
        >
          <InputField name="user" type={TextInputTypes.text} placeholder={t('devconsole~Name')} />
          <DropdownField
            name="role"
            title={t('devconsole~Select a role')}
            items={accessRoles}
            fullWidth
          />
        </MultiColumnField>
        <hr />
        <FormFooter
          handleReset={handleReset}
          isSubmitting={isSubmitting}
          errorMessage={status && status.submitError}
          successMessage={status && !dirty && status.success}
          disableSubmit={disableSubmit}
          showAlert={!disableSubmit}
          submitLabel={t('devconsole~Save')}
          resetLabel={t('devconsole~Reload')}
        />
      </div>
    </Form>
  );
};

export default ProjectAccessForm;
