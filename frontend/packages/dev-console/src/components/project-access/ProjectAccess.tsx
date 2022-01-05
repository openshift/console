import * as React from 'react';
import { Formik } from 'formik';
import * as _ from 'lodash';
import { useTranslation, Trans } from 'react-i18next';
import { Link } from 'react-router-dom';
import { getActiveNamespace } from '@console/internal/actions/ui';
import {
  LoadingBox,
  isUpstream,
  openshiftHelpBase,
  PageHeading,
  ExternalLink,
  StatusBox,
} from '@console/internal/components/utils';
import { RoleBindingModel, RoleModel } from '@console/internal/models';
import {
  getRolesWithNameChange,
  sendRoleBindingRequest,
  getNewRoles,
  getRemovedRoles,
  sendK8sRequest,
  getGroupedRole,
} from './project-access-form-submit-utils';
import { filterRoleBindings, getUserRoleBindings, Roles } from './project-access-form-utils';
import { Verb, UserRoleBinding, roleBinding } from './project-access-form-utils-types';
import { validationSchema } from './project-access-form-validation-utils';
import ProjectAccessForm from './ProjectAccessForm';

export interface ProjectAccessProps {
  namespace: string;
  roleBindings?: { data: []; loaded: boolean; loadError: {} };
  roles: { data: Roles; loaded: boolean };
}

const ProjectAccess: React.FC<ProjectAccessProps> = ({ namespace, roleBindings, roles }) => {
  const { t } = useTranslation();
  if ((!roleBindings.loaded && _.isEmpty(roleBindings.loadError)) || !roles.loaded) {
    return <LoadingBox />;
  }

  const filteredRoleBindings = filterRoleBindings(roleBindings.data, Object.keys(roles.data));

  const userRoleBindings: UserRoleBinding[] = getUserRoleBindings(filteredRoleBindings);

  const rbacLink = isUpstream()
    ? `${openshiftHelpBase}authentication/using-rbac.html`
    : `${openshiftHelpBase}html/authentication_and_authorization/using-rbac`;

  const initialValues = {
    projectAccess: roleBindings.loaded && userRoleBindings,
  };

  const handleSubmit = (values, actions) => {
    let newRoles = getNewRoles(initialValues.projectAccess, values.projectAccess);
    let removeRoles = getRemovedRoles(initialValues.projectAccess, values.projectAccess);
    const updateRoles = getRolesWithNameChange(newRoles, removeRoles);

    if (!_.isEmpty(updateRoles)) {
      newRoles = _.filter(
        newRoles,
        (o1) => !updateRoles.find((o2) => o1.roleBindingName === o2.roleBindingName),
      );
      removeRoles = _.filter(
        removeRoles,
        (o1) => !updateRoles.find((o2) => o1.roleBindingName === o2.roleBindingName),
      );
    }

    const roleBindingRequests = [];
    roleBinding.metadata.namespace = namespace;

    removeRoles = _.filter(removeRoles, (removeRole) => {
      const groupedRole = getGroupedRole(removeRole, roleBindings.data);
      if (groupedRole) {
        roleBindingRequests.push(sendK8sRequest(Verb.Patch, groupedRole));
        return false;
      }
      return true;
    });

    if (!_.isEmpty(updateRoles)) {
      roleBindingRequests.push(...sendRoleBindingRequest(Verb.Patch, updateRoles, roleBinding));
    }
    if (!_.isEmpty(removeRoles)) {
      roleBindingRequests.push(...sendRoleBindingRequest(Verb.Remove, removeRoles, roleBinding));
    }
    if (!_.isEmpty(newRoles)) {
      roleBindingRequests.push(...sendRoleBindingRequest(Verb.Create, newRoles, roleBinding));
    }

    return Promise.all(roleBindingRequests)
      .then(() => {
        actions.resetForm({
          values: {
            projectAccess: values.projectAccess,
          },
          status: { success: t('devconsole~Successfully updated the project access.') },
        });
      })
      .catch((err) => {
        actions.setStatus({ submitError: err.message });
      });
  };

  const handleReset = (values, actions) => {
    actions.resetForm({ status: { success: null }, values: initialValues });
  };

  return (
    <>
      <PageHeading>
        <Trans t={t} ns="devconsole">
          {
            "Project access allows you to add or remove a user's access to the project. More advanced management of role-based access control appear in "
          }
          <Link to={`/k8s/ns/${getActiveNamespace()}/${RoleModel.plural}`}>Roles</Link> and{' '}
          <Link to={`/k8s/ns/${getActiveNamespace()}/${RoleBindingModel.plural}`}>
            Role Bindings
          </Link>
          . For more information, see the{' '}
          <ExternalLink href={rbacLink}>role-based access control documentation</ExternalLink>.
        </Trans>
      </PageHeading>
      {roleBindings.loadError ? (
        <StatusBox loaded={roleBindings.loaded} loadError={roleBindings.loadError} />
      ) : (
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onReset={handleReset}
          validationSchema={validationSchema}
        >
          {(formikProps) => (
            <ProjectAccessForm {...formikProps} roles={roles.data} roleBindings={initialValues} />
          )}
        </Formik>
      )}
    </>
  );
};

export default ProjectAccess;
