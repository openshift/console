import * as React from 'react';
import { FormikProps } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import {
  FlexForm,
  FormBody,
  FormFooter,
  FormHeader,
  SyncedEditorField,
  useActiveNamespace,
  YAMLEditorField,
} from '@console/shared/src';
import { downloadYaml } from '@console/shared/src/components/editor/yaml-download-utils';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import BuildConfigFormEditor from './BuildConfigFormEditor';
import { convertBuildConfigToFormData, convertFormDataToYAML } from './form-utils';
import { BuildConfigFormikValues } from './form-utils/types';
import { BuildConfig, BuildConfigModel } from './types';

const BuildConfigForm: React.FC<FormikProps<BuildConfigFormikValues> & {
  heading: string;
  buildConfig: BuildConfig;
  handleCancel: () => void;
}> = ({
  heading,
  buildConfig: watchedBuildConfig,
  status,
  isSubmitting,
  dirty,
  handleSubmit,
  handleCancel,
  setFieldValue,
  setStatus,
  setErrors,
  errors,
  values,
}) => {
  const { t } = useTranslation();
  const [activeNamespace] = useActiveNamespace();

  const namespace = watchedBuildConfig?.metadata?.namespace || activeNamespace;

  const isStale = watchedBuildConfig?.metadata?.resourceVersion !== values.resourceVersion;

  const formEditor = <BuildConfigFormEditor namespace={namespace} />;
  const yamlEditor = (
    <YAMLEditorField
      name="yamlData"
      model={BuildConfigModel}
      showSamples={!watchedBuildConfig}
      onSave={handleSubmit}
    />
  );

  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'devconsole.buildConfigForm.editor.lastView';

  const sanitizeToForm = (yamlbuildConfig: BuildConfig) =>
    convertBuildConfigToFormData(yamlbuildConfig, values).formData;

  const sanitizeToYaml = () => convertFormDataToYAML(values);

  const onReload = React.useCallback(() => {
    setStatus({ submitSuccess: '', submitError: '' });
    setErrors({});
    if (values.editorType === EditorType.Form) {
      setFieldValue(
        'formData',
        convertBuildConfigToFormData(watchedBuildConfig, values).formData,
        false,
      );
    }
    setFieldValue('yamlData', safeJSToYAML(watchedBuildConfig, '', { skipInvalid: true }), false);
    setFieldValue('resourceVersion', watchedBuildConfig?.metadata?.resourceVersion, true);
  }, [setErrors, setFieldValue, setStatus, values, watchedBuildConfig]);

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
          (values.editorType === EditorType.YAML ? !dirty : !dirty || !_.isEmpty(errors)) ||
          isSubmitting
        }
        handleCancel={handleCancel}
        handleDownload={
          values.editorType === EditorType.YAML && (() => downloadYaml(values.yamlData))
        }
        sticky
      />
    </FlexForm>
  );
};

export default BuildConfigForm;
