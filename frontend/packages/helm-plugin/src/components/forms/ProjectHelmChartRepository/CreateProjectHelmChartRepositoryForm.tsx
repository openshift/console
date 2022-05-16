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
import { ProjectHelmChartRepositoryModel } from '../../../models';
import { ProjectHelmChartRepositoryType } from '../../../types/helm-types';
import CreateProjectHelmChartRepositoryFormEditor from './CreateProjectHelmChartRepositoryFormEditor';
import {
  convertToForm,
  convertToProjectHelmChartRepository,
} from './projecthelmchartrepository-create-utils';

const CreateProjectHelmChartRepositoryForm: React.FC<FormikProps<FormikValues> & {
  resource: ProjectHelmChartRepositoryType;
  handleCancel: () => void;
}> = ({
  resource,
  errors,
  handleSubmit,
  setFieldTouched,
  handleCancel,
  status,
  isSubmitting,
  dirty,
  values: { editorType, formData, yamlData },
}) => {
  const { t } = useTranslation();

  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY =
    'helm-plugin.createProjectHelmChartRepository.editor.lastView';

  const formEditor = <CreateProjectHelmChartRepositoryFormEditor />;

  const yamlEditor = (
    <YAMLEditorField
      name="yamlData"
      model={ProjectHelmChartRepositoryModel}
      showSamples={!resource}
      onSave={handleSubmit}
    />
  );

  const sanitizeToForm = (yamlDeployment: ProjectHelmChartRepositoryType) => {
    const formDetails = convertToForm(yamlDeployment);
    if (formDetails.repoName || formDetails.repoUrl) {
      setFieldTouched('formData.repoName', true);
      setFieldTouched('formData.repoUrl', true);
    }
    return formDetails;
  };

  const sanitizeToYaml = () =>
    safeJSToYAML(
      convertToProjectHelmChartRepository(formData, resource.metadata.namespace),
      'yamlData',
      {
        skipInvalid: true,
      },
    );

  return (
    <FlexForm onSubmit={handleSubmit}>
      <FormBody flexLayout>
        <FormHeader
          title={t('helm-plugin~Create ProjectHelmChartRepository')}
          helpText={t('helm-plugin~Add helm chart repository in the namespace')}
        />
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

export default CreateProjectHelmChartRepositoryForm;
