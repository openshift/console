import type { FC } from 'react';
import { useCallback, useEffect } from 'react';
import * as _ from 'lodash';
import { FormikProps, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import FlexForm from '@console/shared/src/components/form-utils/FlexForm';
import FormBody from '@console/shared/src/components/form-utils/FormBody';
import FormFooter from '@console/shared/src/components/form-utils/FormFooter';
import FormHeader from '@console/shared/src/components/form-utils/FormHeader';
import SyncedEditorField from '@console/shared/src/components/formik-fields/SyncedEditorField';
import CodeEditorField from '@console/shared/src/components/formik-fields/CodeEditorField';
import { downloadYaml } from '@console/shared/src/components/editor/yaml-download-utils';
import { ConfigMapModel } from '@console/internal/models';
import { safeJSToYAML, safeYAMLToJS } from '@console/shared/src/utils/yaml';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import ConfigMapFormFields from './ConfigMapFormFields';
import { ConfigMap, ConfigMapFormInitialValues } from './types';
import { getInitialConfigMapFormData, sanitizeToForm, sanitizeToYaml } from './configmap-utils';

interface ConfigMapFormEditorProps {
  configMap: ConfigMap;
  title: string;
  handleCancel: () => void;
}

export const ConfigMapFormEditor: FC<FormikProps<any> & ConfigMapFormEditorProps> = ({
  values,
  status,
  handleSubmit,
  configMap,
  title,
  isSubmitting,
  dirty,
  handleCancel,
  setStatus,
  setErrors,
  setSubmitting,
  errors,
}) => {
  const { t } = useTranslation();
  const { setFieldValue } = useFormikContext<ConfigMapFormInitialValues>();
  const { editorType, formData, yamlData, formReloadCount, isCreateFlow, resourceVersion } = values;

  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'console.configMapForm.editor.lastView';
  const isStale = !!configMap && configMap?.metadata?.resourceVersion !== resourceVersion;
  const immutableCfg = !!configMap && configMap.immutable;
  const immutableCfgError = t(
    'public~Cannot update the object when immutable field is set to true',
  );
  const disableSubmit =
    immutableCfg ||
    (editorType === EditorType.YAML ? !dirty : !dirty || !_.isEmpty(errors)) ||
    isSubmitting;

  const formEditor = (
    <div className="co-m-pane__form">
      <ConfigMapFormFields />
    </div>
  );

  const yamlEditor = (
    <CodeEditorField
      name="yamlData"
      model={ConfigMapModel}
      showSamples={!configMap?.metadata?.name}
      onSave={() => handleSubmit()}
    />
  );

  const onReload = useCallback(() => {
    setStatus({ submitSuccess: '', submitError: '' });
    setErrors({});
    if (editorType === EditorType.Form) {
      setFieldValue('formData', getInitialConfigMapFormData(configMap, formData.namespace), false);
    }
    setFieldValue('yamlData', safeJSToYAML(configMap, '', { skipInvalid: true }), false);
    setFieldValue('resourceVersion', configMap?.metadata?.resourceVersion, true);
    setFieldValue('formReloadCount', formReloadCount + 1);
  }, [setErrors, setFieldValue, setStatus, configMap, editorType, formData, formReloadCount]);

  useEffect(() => {
    setStatus({ submitError: null });
    setSubmitting(false);
  }, [setStatus, setSubmitting, editorType, formData, yamlData]);

  return (
    <FlexForm onSubmit={handleSubmit} className="configmap-form">
      <FormBody flexLayout>
        <FormHeader
          title={title}
          helpText={t(
            'public~Config maps hold key-value pairs that can be used in pods to read application configuration.',
          )}
        />
        <SyncedEditorField
          name="editorType"
          formContext={{
            name: 'formData',
            editor: formEditor,
            sanitizeTo: (yamlConfigMap: ConfigMap) => sanitizeToForm(formData, yamlConfigMap),
          }}
          yamlContext={{
            name: 'yamlData',
            editor: yamlEditor,
            sanitizeTo: () =>
              sanitizeToYaml(formData, _.merge({}, configMap, safeYAMLToJS(yamlData))),
          }}
          lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
          noMargin
        />
      </FormBody>
      <FormFooter
        handleSubmit={handleSubmit}
        handleReset={isCreateFlow ? null : onReload}
        errorMessage={status?.submitError || (immutableCfg && immutableCfgError)}
        successMessage={status?.submitSuccess}
        showAlert={isStale}
        infoTitle={t('public~This object has been updated.')}
        infoMessage={t('public~Click reload to see the new version.')}
        isSubmitting={isSubmitting}
        submitLabel={isCreateFlow ? t('public~Create') : t('public~Save')}
        disableSubmit={disableSubmit}
        handleCancel={handleCancel}
        handleDownload={editorType === EditorType.YAML && (() => downloadYaml(yamlData))}
        sticky
      />
    </FlexForm>
  );
};
