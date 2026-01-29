import type { FC } from 'react';
import { useRef, useCallback } from 'react';
import type { FormikBag } from 'formik';
import { Formik } from 'formik';
import { safeLoad } from 'js-yaml';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom-v5-compat';
import { k8sCreateResource, k8sUpdateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { getResourcesType } from '../edit-application/edit-application-utils';
import { Resources } from '../import/import-types';
import EditDeploymentForm from './DeploymentForm';
import type { EditDeploymentData, EditDeploymentFormikValues } from './utils/deployment-types';
import { convertDeploymentToEditForm, convertEditFormToDeployment } from './utils/deployment-utils';
import { validationSchema } from './utils/deployment-validation-utils';

export interface EditDeploymentProps {
  heading: string;
  resource: K8sResourceKind;
  name: string;
  namespace: string;
}

const EditDeployment: FC<EditDeploymentProps> = ({ heading, resource, namespace, name }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isNew = !name;

  const initialValues = useRef({
    editorType: EditorType.Form,
    yamlData: safeJSToYAML(resource, 'yamlData', {
      skipInvalid: true,
    }),
    formData: convertDeploymentToEditForm(resource),
    formReloadCount: 0,
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
        if (!deploymentRes?.metadata?.namespace) {
          deploymentRes.metadata.namespace = namespace;
        }
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

    const resourceCall = isNew
      ? k8sCreateResource({
          model: resourceType === Resources.OpenShift ? DeploymentConfigModel : DeploymentModel,
          data: deploymentRes,
        })
      : k8sUpdateResource({
          model: resourceType === Resources.OpenShift ? DeploymentConfigModel : DeploymentModel,
          data: deploymentRes,
          name,
          ns: namespace,
        });

    return resourceCall
      .then((res: K8sResourceKind) => {
        const model =
          resourceType === Resources.OpenShift ? DeploymentConfigModel : DeploymentModel;
        if (isNew) {
          actions.setStatus({
            submitError: '',
            submitSuccess: t('devconsole~{{resource}} has been created', { resource: res.kind }),
          });
        } else {
          const resVersion = res.metadata.resourceVersion;
          actions.setStatus({
            submitError: '',
            submitSuccess: t('devconsole~{{name}} has been updated to version {{resVersion}}', {
              name,
              resVersion,
            }),
          });
        }
        navigate(`/k8s/ns/${namespace}/${model.plural}/${res.metadata.name}`);
      })
      .catch((err) => {
        actions.setStatus({ submitSuccess: '', submitError: err.message });
      });
  };

  const handleCancel = useCallback(() => navigate(-1), [navigate]);

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
