import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { FormikProps, FormikValues } from 'formik';
import { safeLoad } from 'js-yaml';
import { saveAs } from 'file-saver';
import {
  FlexForm,
  FormBody,
  FormFooter,
  FormHeader,
  SyncedEditorField,
  YAMLEditorField,
} from '@console/shared/src';
import { K8sResourceKind } from '@console/internal/module/k8s';
import EditDeploymentFormEditor from './EditDeploymentFormEditor';
import { getResourcesType } from '../edit-application/edit-application-utils';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import * as _ from 'lodash';
import { Resources } from '../import/import-types';
import { DeploymentConfigModel, DeploymentModel } from '@console/internal/models';
import { history } from '@console/internal/components/utils';
import {
  convertDeploymentToEditForm,
  convertEditFormToDeployment,
} from './utils/edit-deployment-utils';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';

const EditDeploymentForm: React.FC<FormikProps<FormikValues> & {
  heading: string;
  resource: K8sResourceKind;
}> = ({
  heading,
  resource,
  status,
  isSubmitting,
  dirty,
  handleSubmit,
  setFieldValue,
  setStatus,
  setErrors,
  errors,
  values: { editorType, formData, yamlData },
}) => {
  const { t } = useTranslation();
  const resourceType = getResourcesType(resource);

  const isStale = React.useMemo(
    () => resource.metadata.resourceVersion !== formData.resourceVersion,
    [resource.metadata.resourceVersion, formData.resourceVersion],
  );

  const formEditor = (
    <EditDeploymentFormEditor resourceType={resourceType} resourceObj={resource} />
  );

  const yamlEditor = (
    <YAMLEditorField
      name="yamlData"
      model={resourceType === Resources.OpenShift ? DeploymentConfigModel : DeploymentModel}
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

  const onReload = () => {
    setStatus({ submitSuccess: '' });
    setStatus({ submitError: '' });
    setErrors({});
    if (editorType === EditorType.YAML) {
      setFieldValue('yamlData', safeJSToYAML(resource, 'yamlData', { skipInvalid: true }));
    } else {
      setFieldValue('formData', convertDeploymentToEditForm(resource));
    }
  };

  const downloadYaml = (data) => {
    const blob = new Blob([data], { type: 'text/yaml;charset=utf-8' });
    let filename = 'k8s-object.yaml';
    try {
      const obj = safeLoad(data);
      if (obj.kind) {
        filename = `${obj.kind.toLowerCase()}-${obj.metadata.name}.yaml`;
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
    saveAs(blob, filename);
  };

  return (
    <>
      <FlexForm onSubmit={handleSubmit}>
        <FormBody flexLayout>
          <FormHeader title={heading} marginBottom="sm" />
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
          disableSubmit={editorType === EditorType.YAML ? !dirty : !dirty || !_.isEmpty(errors)}
          handleCancel={history.goBack}
          downloadYAML={editorType === EditorType.YAML && (() => downloadYaml(yamlData))}
          sticky
        />
      </FlexForm>
    </>
  );
};

export default EditDeploymentForm;
