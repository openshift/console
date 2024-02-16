import * as React from 'react';
import { FormikBag, Formik } from 'formik';
import { safeLoad } from 'js-yaml';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { useDispatch } from 'react-redux';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { k8sCreateResource, k8sUpdateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import * as UIActions from '@console/internal/actions/ui';
import { history } from '@console/internal/components/utils';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { usePerspectives } from '@console/shared/src';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { getResourcesType } from '../edit-application/edit-application-utils';
import { handleRedirect } from '../import/import-submit-utils';
import { Resources } from '../import/import-types';
import EditDeploymentForm from './DeploymentForm';
import { EditDeploymentData, EditDeploymentFormikValues } from './utils/deployment-types';
import { convertDeploymentToEditForm, convertEditFormToDeployment } from './utils/deployment-utils';
import { validationSchema } from './utils/deployment-validation-utils';

export interface EditDeploymentProps {
  heading: string;
  resource: K8sResourceKind;
  name: string;
  namespace: string;
}

const EditDeployment: React.FC<EditDeploymentProps> = ({ heading, resource, namespace, name }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [perspective] = useActivePerspective();
  const perspectiveExtensions = usePerspectives();
  const isNew = !name || name === '~new';

  const initialValues = React.useRef({
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
          isFullResponse: true,
        })
      : k8sUpdateResource({
          model: resourceType === Resources.OpenShift ? DeploymentConfigModel : DeploymentModel,
          data: deploymentRes,
          name,
          ns: namespace,
        });

    return resourceCall
      .then((res: any) => {
        if (isNew) {
          const model =
            resourceType === Resources.OpenShift ? DeploymentConfigModel : DeploymentModel;
          actions.setStatus({
            submitError: '',

            submitSuccess: t('devconsole~{{resource}} has been created', {
              resource: res.data.kind,
            }),
          });
          dispatch(UIActions.setWarningPolicy(res));
          history.push(`/k8s/ns/${namespace}/${model.plural}/${res.data.metadata.name}`);
        } else {
          const resVersion = res.data.metadata.resourceVersion;
          actions.setStatus({
            submitError: '',
            submitSuccess: t('devconsole~{{name}} has been updated to version {{resVersion}}', {
              name,
              resVersion,
            }),
          });
          handleRedirect(namespace, perspective, perspectiveExtensions);
        }
      })
      .catch((err) => {
        actions.setStatus({ submitSuccess: '', submitError: err.message });
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
