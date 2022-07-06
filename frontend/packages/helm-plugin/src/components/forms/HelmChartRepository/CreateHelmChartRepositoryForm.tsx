import * as React from 'react';
import { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  FormFooter,
  FormBody,
  FormHeader,
  FlexForm,
  SyncedEditorField,
  YAMLEditorField,
} from '@console/shared/src';
import { downloadYaml } from '@console/shared/src/components/editor/yaml-download-utils';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../../models';
import { HelmChartRepositoryType } from '../../../types/helm-types';
import CreateHelmChartRepositoryFormEditor from './CreateHelmChartRepositoryFormEditor';
import { convertToForm, convertToHelmChartRepository } from './helmchartrepository-create-utils';

const CreateHelmChartRepositoryForm: React.FC<FormikProps<FormikValues> & {
  resource: HelmChartRepositoryType;
  namespace: string;
  handleCancel: () => void;
  showScopeType: boolean;
}> = ({
  resource,
  namespace,
  errors,
  handleSubmit,
  setFieldTouched,
  handleCancel,
  status,
  isSubmitting,
  dirty,
  showScopeType,
  values: { editorType, formData, yamlData },
}) => {
  const { t } = useTranslation();

  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY =
    'helm-plugin.createHelmChartRepository.editor.lastView';

  const formEditor = <CreateHelmChartRepositoryFormEditor showScopeType={showScopeType} />;

  const yamlEditor = (
    <YAMLEditorField
      name="yamlData"
      model={
        formData.scope === ProjectHelmChartRepositoryModel.kind
          ? ProjectHelmChartRepositoryModel
          : HelmChartRepositoryModel
      }
      showSamples={!resource}
      onSave={handleSubmit}
    />
  );

  const sanitizeToForm = (yamlDeployment: HelmChartRepositoryType) => {
    const formDetails = convertToForm(yamlDeployment);
    if (formDetails.repoName || formDetails.repoUrl) {
      setFieldTouched('formData.repoName', true);
      setFieldTouched('formData.repoUrl', true);
    }
    return formDetails;
  };

  const sanitizeToYaml = () =>
    safeJSToYAML(convertToHelmChartRepository(formData, namespace), 'yamlData', {
      skipInvalid: true,
    });

  const formTitle =
    !showScopeType && formData.scope === ProjectHelmChartRepositoryModel.kind
      ? t('helm-plugin~Create ProjectHelmChartRepository')
      : t('helm-plugin~Create Helm Chart Repository');

  const formDescription =
    !showScopeType && formData.scope === ProjectHelmChartRepositoryModel.kind
      ? t('helm-plugin~Add helm chart repository in the namespace.')
      : t('helm-plugin~Add helm chart repository');

  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormBody flexLayout>
        <FormHeader title={formTitle} helpText={formDescription} />
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
        errorMessage={status?.submitError}
        successMessage={status?.submitSuccess}
        isSubmitting={isSubmitting}
        submitLabel={t('helm-plugin~Create')}
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

export default CreateHelmChartRepositoryForm;
