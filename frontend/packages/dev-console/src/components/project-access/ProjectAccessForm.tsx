import * as React from 'react';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { FormikProps, FormikValues } from 'formik';
import { Form, TextInputTypes } from '@patternfly/react-core';
import { MultiColumnField, InputField, DropdownField, FormFooter } from '@console/shared';
import { Roles, ignoreRoleBindingName } from './project-access-form-utils';
import { UserRoleBinding } from './project-access-form-utils-types';
import './ProjectAccessForm.scss';

type ProjectAccessFormProps = FormikProps<FormikValues> & {
  roles: Roles;
  roleBindings: { projectAccess: UserRoleBinding[] };
};

const ProjectAccessForm: React.FC<ProjectAccessFormProps> = ({
  handleSubmit,
  handleReset,
  isSubmitting,
  status,
  errors,
  dirty,
  roles,
  roleBindings,
  values,
}) => {
  const { t } = useTranslation();
  const [isStaleInfo, setIsStaleInfo] = React.useState<boolean>(false);
  const disableSubmit = !dirty || !_.isEmpty(errors) || isSubmitting;

  React.useEffect(() => {
    !_.isEqual(
      ignoreRoleBindingName(roleBindings.projectAccess),
      ignoreRoleBindingName(values.projectAccess),
    )
      ? setIsStaleInfo(true)
      : setIsStaleInfo(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roleBindings]);

  const onReload = () => {
    handleReset();
    setIsStaleInfo(false);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div className="co-m-pane__body odc-project-access-form__body">
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
        </div>
      </div>
      <FormFooter
        handleReset={onReload}
        isSubmitting={isSubmitting}
        errorMessage={status && status.submitError}
        successMessage={status && !dirty && status.success}
        disableSubmit={isStaleInfo || disableSubmit}
        showAlert={isStaleInfo || !disableSubmit}
        submitLabel={t('devconsole~Save')}
        resetLabel={t('devconsole~Reload')}
        infoTitle={isStaleInfo && t('devconsole~This list has been updated.')}
        infoMessage={isStaleInfo && t('devconsole~Click reload to see the new list.')}
      />
    </Form>
  );
};

export default ProjectAccessForm;
