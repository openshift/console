import * as React from 'react';
import * as _ from 'lodash';
import { FormikProps, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import {
  FlexForm,
  FormBody,
  FormFooter,
  FormHeader,
  SyncedEditorField,
  CodeEditorField,
} from '@console/shared';
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

export const ConfigMapFormEditor: React.FC<FormikProps<any> & ConfigMapFormEditorProps> = ({
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
  errors,
}) => {
  const { t } = useTranslation();
  const { setFieldValue } = useFormikContext<ConfigMapFormInitialValues>();
  const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'console.configMapForm.editor.lastView';
  const isStale = !!configMap && configMap?.metadata?.resourceVersion !== values.resourceVersion;
  const immutableCfg = !!configMap && configMap.immutable;
  const immutableCfgError = t(
    'public~Cannot update the object when immutable field is set to true',
  );
  const disableSubmit =
    immutableCfg ||
    (values.editorType === EditorType.YAML ? !dirty : !dirty || !_.isEmpty(errors)) ||
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
      showSamples={false}
      onSave={() => handleSubmit()}
    />
  );

  const onReload = React.useCallback(() => {
    setStatus({ submitSuccess: '', submitError: '' });
    setErrors({});
    if (values.editorType === EditorType.Form) {
      setFieldValue(
        'formData',
        getInitialConfigMapFormData(configMap, values.formData.namespace),
        false,
      );
    }
    setFieldValue('yamlData', safeJSToYAML(configMap, '', { skipInvalid: true }), false);
    setFieldValue('resourceVersion', configMap?.metadata?.resourceVersion, true);
    setFieldValue('formReloadCount', values.formReloadCount + 1);
  }, [setErrors, setFieldValue, setStatus, values, configMap]);

  React.useEffect(() => {
    setStatus({ submitError: null });
  }, [setStatus, values.editorType]);

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
            sanitizeTo: (yamlConfigMap: ConfigMap) =>
              sanitizeToForm(values.formData, yamlConfigMap),
          }}
          yamlContext={{
            name: 'yamlData',
            editor: yamlEditor,
            sanitizeTo: () =>
              sanitizeToYaml(
                values.formData,
                _.merge({}, configMap, safeYAMLToJS(values.yamlData)),
              ),
          }}
          lastViewUserSettingKey={LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY}
          noMargin
        />
      </FormBody>
      <FormFooter
        handleSubmit={handleSubmit}
        handleReset={values.isCreateFlow ? null : onReload}
        errorMessage={status?.submitError || (immutableCfg && immutableCfgError)}
        successMessage={status?.submitSuccess}
        showAlert={isStale}
        infoTitle={t('public~This object has been updated.')}
        infoMessage={t('public~Click reload to see the new version.')}
        isSubmitting={isSubmitting}
        submitLabel={values.isCreateFlow ? t('public~Create') : t('public~Save')}
        disableSubmit={disableSubmit}
        handleCancel={handleCancel}
        handleDownload={
          values.editorType === EditorType.YAML && (() => downloadYaml(values.yamlData))
        }
        sticky
      />
    </FlexForm>
  );
};
