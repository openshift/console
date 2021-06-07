import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FormikProps, FormikValues } from 'formik';
import { Form, TextInputTypes } from '@patternfly/react-core';
import { MultiColumnField, InputField, DropdownField, FormFooter } from '@console/shared';
import { Roles } from './project-access-form-utils';

type ProjectAccessFormProps = FormikProps<FormikValues> & { roles: Roles };

const ProjectAccessForm: React.FC<ProjectAccessFormProps> = ({
  handleSubmit,
  handleReset,
  isSubmitting,
  status,
  errors,
  dirty,
  roles,
}) => {
  const { t } = useTranslation();
  const disableSubmit = !dirty || !_.isEmpty(errors) || isSubmitting;
  return (
    <Form onSubmit={handleSubmit}>
      <div className="co-m-pane__form">
        <MultiColumnField
          name="projectAccess"
          addLabel={t('devconsole~Add access')}
          headers={[t('devconsole~Name'), t('devconsole~Role')]}
          emptyValues={{ user: '', role: '' }}
        >
          <InputField name="user" type={TextInputTypes.text} placeholder={t('devconsole~Name')} />
          <DropdownField
            name="role"
            title={t('devconsole~Select a role')}
            items={roles}
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
