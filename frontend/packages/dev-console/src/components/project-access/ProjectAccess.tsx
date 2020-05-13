import * as React from 'react';
import * as _ from 'lodash';
import { Formik } from 'formik';
import { Link } from 'react-router-dom';
import {
  LoadingBox,
  PageHeading,
  ExternalLink,
  StatusBox,
} from '@console/internal/components/utils';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { RoleBindingModel, RoleModel } from '@console/internal/models';
import { filterRoleBindings, getUserRoleBindings } from './project-access-form-utils';
import {
  getRolesWithNameChange,
  sendRoleBindingRequest,
  getNewRoles,
  getRemovedRoles,
} from './project-access-form-submit-utils';
import { validationSchema } from './project-access-form-validation-utils';
import ProjectAccessForm from './ProjectAccessForm';
import { Verb, UserRoleBinding, Roles, roleBinding } from './project-access-form-utils-types';

export interface ProjectAccessProps {
  formName: string;
  namespace: string;
  roleBindings?: { data: []; loaded: boolean; loadError: {} };
}

const ProjectAccess: React.FC<ProjectAccessProps> = ({ formName, namespace, roleBindings }) => {
  if (!roleBindings.loaded && _.isEmpty(roleBindings.loadError)) {
    return <LoadingBox />;
  }

  const filteredRoleBindings = filterRoleBindings(roleBindings, Roles);

  const userRoleBindings: UserRoleBinding[] = getUserRoleBindings(filteredRoleBindings);

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

    actions.setSubmitting(true);
    if (!_.isEmpty(updateRoles)) {
      roleBindingRequests.push(...sendRoleBindingRequest(Verb.Patch, updateRoles, roleBinding));
    }
    if (!_.isEmpty(removeRoles)) {
      roleBindingRequests.push(...sendRoleBindingRequest(Verb.Remove, removeRoles, roleBinding));
    }
    if (!_.isEmpty(newRoles)) {
      roleBindingRequests.push(...sendRoleBindingRequest(Verb.Create, newRoles, roleBinding));
    }

    Promise.all(roleBindingRequests)
      .then(() => {
        actions.setSubmitting(false);
        actions.resetForm({
          values: {
            projectAccess: values.projectAccess,
          },
          status: { success: `Successfully updated the ${formName}.` },
        });
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
      });
  };

  const handleReset = (values, actions) => {
    actions.resetForm({ status: { success: null } });
  };

  return (
    <>
      <PageHeading>
        Project Access allows you to add or remove a user&apos;s access to the project. More
        advanced management of role-based access control appear in{' '}
        <Link to={`/k8s/ns/${getActiveNamespace()}/${RoleModel.plural}`}>Roles</Link> and{' '}
        <Link to={`/k8s/ns/${getActiveNamespace()}/${RoleBindingModel.plural}`}>Role Bindings</Link>
        . For more information, see the{' '}
        <ExternalLink
          href="https://docs.openshift.com/container-platform/4.1/authentication/using-rbac.html"
          text="role-based access control documentation"
        />{' '}
        .
      </PageHeading>
      <div className="co-m-pane__body">
        {roleBindings.loadError ? (
          <StatusBox loaded={roleBindings.loaded} loadError={roleBindings.loadError} />
        ) : (
          <Formik
            initialValues={initialValues}
            onSubmit={handleSubmit}
            onReset={handleReset}
            validationSchema={validationSchema}
          >
            {(props) => <ProjectAccessForm {...props} />}
          </Formik>
        )}
      </div>
    </>
  );
};

export default ProjectAccess;
