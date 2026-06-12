import type { FC } from 'react';
import type { FormikProps, FormikValues } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { downloadYaml } from '@console/shared/src/components/editor/yaml-download-utils';
import { FlexForm } from '@console/shared/src/components/form-utils/FlexForm';
import { FormBody } from '@console/shared/src/components/form-utils/FormBody';
import { FormFooter } from '@console/shared/src/components/form-utils/FormFooter';
import { FormHeader } from '@console/shared/src/components/form-utils/FormHeader';
import { CodeEditorField } from '@console/shared/src/components/formik-fields/CodeEditorField';
import { SyncedEditorField } from '@console/shared/src/components/formik-fields/SyncedEditorField';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { HelmChartRepositoryModel, ProjectHelmChartRepositoryModel } from '../../../models/helm';
import type { HelmChartRepositoryType } from '../../../types/helm-types';
import CreateHelmChartRepositoryFormEditor from './CreateHelmChartRepositoryFormEditor';
import { convertToForm, convertToHelmChartRepository } from './helmchartrepository-create-utils';

const CreateHelmChartRepositoryForm: FC<
  FormikProps<FormikValues> & {
    namespace: string;
    handleCancel: () => void;
    showScopeType: boolean;
    existingRepo: HelmChartRepositoryType;
  }
> = ({
  namespace,
  errors,
  handleSubmit,
  handleCancel,
  status,
  isSubmitting,
  dirty,
  showScopeType,
  values: { editorType, formData, yamlData },
  existingRepo,
}) => {
  const { t } = useTranslation('helm-plugin');

  const LAST_VIEWED_EDITOR_TYPE_USER_PREFERENCE_KEY =
    'helm-plugin.createHelmChartRepository.editor.lastView';

  const formEditor = (
    <CreateHelmChartRepositoryFormEditor
      showScopeType={showScopeType}
      existingRepo={existingRepo}
      namespace={namespace}
    />
  );

  const yamlEditor = (
    <CodeEditorField
      name="yamlData"
      model={
        formData.scope === ProjectHelmChartRepositoryModel.kind
          ? ProjectHelmChartRepositoryModel
          : HelmChartRepositoryModel
      }
      showSamples={!existingRepo}
      onSave={handleSubmit}
    />
  );

  const sanitizeToForm = (yamlDeployment: HelmChartRepositoryType) => {
    const formDetails = convertToForm(yamlDeployment);
    return formDetails;
  };

  const sanitizeToYaml = () =>
    safeJSToYAML(convertToHelmChartRepository(formData, namespace), 'yamlData', {
      skipInvalid: true,
    });

  const formTitle =
    !showScopeType && formData.scope === ProjectHelmChartRepositoryModel.kind
      ? existingRepo
        ? t('Edit ProjectHelmChartRepository')
        : t('Create ProjectHelmChartRepository')
      : existingRepo
      ? t('Edit {{label}}', { label: existingRepo.kind })
      : t('Create Helm Chart Repository');

  const formDescription =
    !showScopeType && formData.scope === ProjectHelmChartRepositoryModel.kind
      ? existingRepo
        ? t('Update helm chart repository in the namespace.')
        : t('Add helm chart repository in the namespace.')
      : existingRepo
      ? existingRepo.kind === ProjectHelmChartRepositoryModel.kind
        ? t('Update helm chart repository in the namespace.')
        : t('Update the helm chart repository.')
      : t('Add helm chart repository.');

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
          lastViewUserPreferenceKey={LAST_VIEWED_EDITOR_TYPE_USER_PREFERENCE_KEY}
          noMargin
        />
      </FormBody>
      <FormFooter
        errorMessage={status?.submitError}
        successMessage={status?.submitSuccess}
        isSubmitting={isSubmitting}
        submitLabel={existingRepo ? t('Save') : t('Create')}
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
