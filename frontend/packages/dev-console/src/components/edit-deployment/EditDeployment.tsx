import * as React from 'react';
import { FormikBag, Formik } from 'formik';
import { safeLoad } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import { history } from '@console/internal/components/utils';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import { K8sResourceKind, k8sUpdate } from '@console/internal/module/k8s';
import { useExtensions, Perspective, isPerspective } from '@console/plugin-sdk';
import { useActivePerspective } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { getResourcesType } from '../edit-application/edit-application-utils';
import { handleRedirect } from '../import/import-submit-utils';
import { Resources } from '../import/import-types';
import EditDeploymentForm from './EditDeploymentForm';
import { EditDeploymentData, EditDeploymentFormikValues } from './utils/edit-deployment-types';
import {
  convertDeploymentToEditForm,
  convertEditFormToDeployment,
} from './utils/edit-deployment-utils';
import { validationSchema } from './utils/edit-deployment-validation-utils';

export interface EditDeploymentProps {
  heading: string;
  resource: K8sResourceKind;
  name: string;
  namespace: string;
}

const EditDeployment: React.FC<EditDeploymentProps> = ({ heading, resource, namespace, name }) => {
  const { t } = useTranslation();
  const [perspective] = useActivePerspective();
  const perspectiveExtensions = useExtensions<Perspective>(isPerspective);

  const initialValues = React.useRef({
    editorType: EditorType.Form,
    yamlData: '',
    formData: convertDeploymentToEditForm(resource),
  });

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
        actions.setStatus({
          submitSuccess: '',
          submitError: t('devconsole~Invalid YAML - {{err}}', { err }),
        });
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
        const resVersion = res.metadata.resourceVersion;
        actions.setStatus({
          submitError: '',
          submitSuccess: t('devconsole~{{name}} has been updated to version {{resVersion}}', {
            name,
            resVersion,
          }),
        });
        handleRedirect(namespace, perspective, perspectiveExtensions);
      })
      .catch((e) => {
        const err = e.message;
        actions.setStatus({ submitSuccess: '', submitError: t('devconsole~{{err}}', { err }) });
      });
  };

  const handleCancel = () => history.goBack();

  return (
    <Formik
      initialValues={initialValues.current}
      onSubmit={handleSubmit}
      validationSchema={validationSchema()}
      enableReinitialize
    >
      {(formikProps) => {
        return (
          <EditDeploymentForm
            {...formikProps}
            heading={heading}
            resource={resource}
            handleCancel={handleCancel}
          />
        );
      }}
    </Formik>
  );
};

export default EditDeployment;
