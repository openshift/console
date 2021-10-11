import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  FlexForm,
  FormBody,
  FormFooter,
  FormHeader,
  SyncedEditorField,
  YAMLEditorField,
} from '@console/shared/src';
import { downloadYaml } from '@console/shared/src/components/editor/yaml-download-utils';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { getResourcesType } from '../edit-application/edit-application-utils';
import { Resources } from '../import/import-types';
import EditDeploymentFormEditor from './EditDeploymentFormEditor';
import {
  convertDeploymentToEditForm,
  convertEditFormToDeployment,
} from './utils/edit-deployment-utils';

const EditDeploymentForm: React.FC<FormikProps<FormikValues> & {
  heading: string;
  resource: K8sResourceKind;
  handleCancel: () => void;
}> = ({
  heading,
  resource,
  status,
  isSubmitting,
  dirty,
  handleSubmit,
  handleCancel,
  setFieldValue,
  setStatus,
  setErrors,
  errors,
  values: { editorType, formData, yamlData },
}) => {
  const { t } = useTranslation();
  const resourceType = getResourcesType(resource);

  const isStale = resource.metadata.resourceVersion !== formData.resourceVersion;

  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'devconsole.editDeploymentForm.editor.lastView';

  const formEditor = (
    <EditDeploymentFormEditor resourceType={resourceType} resourceObj={resource} />
  );

  const yamlEditor = (
    <YAMLEditorField
      name="yamlData"
      model={resourceType === Resources.OpenShift ? DeploymentConfigModel : DeploymentModel}
      showSamples={!resource}
      onSave={handleSubmit}
    />
  );

  const sanitizeToForm = (yamlDeployment: K8sResourceKind) => {
    return convertDeploymentToEditForm(yamlDeployment);
  };

  const sanitizeToYaml = () =>
    safeJSToYAML(convertEditFormToDeployment(formData, resource), 'yamlData', {
      skipInvalid: true,
    });

  const onReload = React.useCallback(() => {
    setStatus({ submitSuccess: '', submitError: '' });
    setErrors({});
    if (editorType === EditorType.YAML) {
      setFieldValue('formData.resourceVersion', resource.metadata.resourceVersion);
      setFieldValue('yamlData', safeJSToYAML(resource, 'yamlData', { skipInvalid: true }));
    } else {
      setFieldValue('formData', convertDeploymentToEditForm(resource));
    }
  }, [editorType, resource, setErrors, setFieldValue, setStatus]);

  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormBody flexLayout>
        <FormHeader title={heading} />
        <SyncedEditorField
          name="editorType"
          formContext={{
            name: 'formData',
            editor: formEditor,
            sanitizeTo: sanitizeToForm,
          }}
          yamlContext={{
            name: 'yamlData',
            editor: yamlEditor,
            sanitizeTo: sanitizeToYaml,
          }}
          lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
          noMargin
        />
      </FormBody>
      <FormFooter
        handleReset={onReload}
        errorMessage={status?.submitError}
        successMessage={status?.submitSuccess}
        showAlert={isStale}
        infoTitle={t('devconsole~This object has been updated.')}
        infoMessage={t('devconsole~Click reload to see the new version.')}
        isSubmitting={isSubmitting}
        submitLabel={t('devconsole~Save')}
        disableSubmit={
          (editorType === EditorType.YAML ? !dirty : !dirty || !_.isEmpty(errors)) || isSubmitting
        }
        handleCancel={handleCancel}
        handleDownload={editorType === EditorType.YAML && (() => downloadYaml(yamlData))}
        sticky
      />
    </FlexForm>
  );
};

export default EditDeploymentForm;
