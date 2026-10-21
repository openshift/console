import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { Form, TextInputTypes } from '@patternfly/react-core';
import type { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  MultiColumnField,
  InputField,
  DropdownField,
  FormFooter,
  NSDropdownField,
} from '@console/shared';
import PaneBody from '@console/shared/src/components/layout/PaneBody';
import type { Roles } from './project-access-form-utils';
import { ignoreRoleBindingName } from './project-access-form-utils';
import type { UserRoleBinding } from './project-access-form-utils-types';
import './ProjectAccessForm.scss';

type ProjectAccessFormProps = FormikProps<FormikValues> & {
  roles: Roles;
  roleBindings: { projectAccess: UserRoleBinding[] };
  onCancel?: () => void;
};

type SubjectNamespaceDropdownProps = {
  name?: string;
  values: FormikValues;
};

export const SubjectNamespaceDropdown: FC<SubjectNamespaceDropdownProps> = ({ name, values }) => {
  const { t } = useTranslation();
  const arr = name.split('.');
  const showDropdown =
    arr.length > 2 && values?.projectAccess?.[arr?.[1]]?.subject?.kind === 'ServiceAccount';
  return (
    <div>
      <DropdownField
        name={`${name}.kind`}
        title={t('devconsole~Select a type')}
        items={{ Group: 'Group', ServiceAccount: 'ServiceAccount', User: 'User' }}
        fullWidth
        className="odc-project-access-form__subject-kind-dropdown"
      />
      {showDropdown && <NSDropdownField name={`${name}.namespace`} fullWidth />}
    </div>
  );
};

const ProjectAccessForm: FC<ProjectAccessFormProps> = ({
  handleSubmit,
  handleReset,
  isSubmitting,
  status,
  errors,
  dirty,
  roles,
  roleBindings,
  values,
  initialValues,
  onCancel,
}) => {
  const { t } = useTranslation();
  const [isStaleInfo, setIsStaleInfo] = useState<boolean>(false);
  const disableSubmit = !dirty || !_.isEmpty(errors) || isSubmitting;

  useEffect(() => {
    !_.isEqual(
      ignoreRoleBindingName(roleBindings.projectAccess),
      ignoreRoleBindingName(initialValues.projectAccess),
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
      <PaneBody className="odc-project-access-form__body">
        <div className="co-m-pane__form">
          <MultiColumnField
            name="projectAccess"
            addLabel={t('devconsole~Add access')}
            headers={[t('devconsole~Subject'), t('devconsole~Name'), t('devconsole~Role')]}
            emptyValues={{ name: '', role: '' }}
          >
            <SubjectNamespaceDropdown name="subject" values={values} />
            <InputField
              name="subject.name"
              type={TextInputTypes.text}
              placeholder={t('devconsole~Name')}
            />
            <DropdownField
              dataTest="role-dropdown"
              name="role"
              title={t('devconsole~Select a role')}
              items={roles}
              fullWidth
            />
          </MultiColumnField>
        </div>
      </PaneBody>
      <FormFooter
        handleReset={onReload}
        isSubmitting={isSubmitting}
        errorMessage={status?.submitError}
        successMessage={!dirty && status?.success}
        disableSubmit={isStaleInfo || disableSubmit}
        showAlert={isStaleInfo || !disableSubmit}
        submitLabel={t('devconsole~Save')}
        resetLabel={t('devconsole~Reload')}
        infoTitle={isStaleInfo && t('devconsole~This list has been updated.')}
        infoMessage={isStaleInfo && t('devconsole~Click reload to see the new list.')}
        handleCancel={onCancel}
      />
    </Form>
  );
};

export default ProjectAccessForm;
