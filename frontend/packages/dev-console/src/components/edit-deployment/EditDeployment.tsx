import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormikBag, Formik } from 'formik';
import { safeLoad } from 'js-yaml';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import { K8sResourceKind, k8sUpdate } from '@console/internal/module/k8s';
import { getResourcesType } from '../edit-application/edit-application-utils';
import { Resources } from '../import/import-types';
import EditDeploymentForm from './EditDeploymentForm';
import {
  convertDeploymentToEditForm,
  convertEditFormToDeployment,
} from './utils/edit-deployment-utils';
import { handleRedirect } from '../import/import-submit-utils';
import { useExtensions, Perspective, isPerspective } from '@console/plugin-sdk';
import { useActivePerspective } from '@console/shared';
import { EditDeploymentData, EditDeploymentFormikValues } from './utils/edit-deployment-types';
import { validationSchema } from './utils/edit-deployment-validation-utils';

const EditDeployment: React.FC<{
  heading: string;
  resource: K8sResourceKind;
  name: string;
  namespace: string;
}> = ({ heading, resource, namespace, name }) => {
  const { t } = useTranslation();
  const [perspective] = useActivePerspective();
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);

  const initialValues = {
    editorType: EditorType.Form,
    yamlData: '',
    formData: convertDeploymentToEditForm(resource),
  };

  const handleSubmit = (
    values: EditDeploymentFormikValues,
    actions: FormikBag<any, EditDeploymentData>,
  ) => {
    let deploymentRes: K8sResourceKind;
    const resourceType = getResourcesType(resource);
    if (values.editorType === EditorType.YAML) {
      try {
        deploymentRes = safeLoad(values.yamlData);
      } catch (err) {
        actions.setStatus({ submitError: `Invalid YAML - ${err}` });
        return null;
      }
    } else {
      deploymentRes = convertEditFormToDeployment(values.formData, resource);
    }

    const resourceCall = k8sUpdate(
      resourceType === Resources.OpenShift ? DeploymentConfigModel : DeploymentModel,
      deploymentRes,
      namespace,
      name,
    );

    return resourceCall
      .then((res: K8sResourceKind) => {
        actions.setStatus({ submitError: '' });
        actions.setStatus({
          submitSuccess: `${name} has been updated to version ${res.metadata.resourceVersion}`,
        });
        handleRedirect(namespace, perspective, perspectiveExtensions);
      })
      .catch((e) => {
        actions.setStatus({ submitSuccess: '' });
        actions.setStatus({ submitError: e.message });
      });
  };

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema(t)}
    >
      {(formikProps) => {
        return <EditDeploymentForm {...formikProps} heading={heading} resource={resource} />;
      }}
    </Formik>
  );
};

export default EditDeployment;
