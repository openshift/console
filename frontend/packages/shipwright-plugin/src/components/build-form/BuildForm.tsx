import * as React from 'react';
import { FormikProps } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom-v5-compat';
import {
  CodeEditorField,
  FlexForm,
  FormBody,
  FormFooter,
  FormHeader,
  SyncedEditorField,
} from '@console/shared/src';
import { downloadYaml } from '@console/shared/src/components/editor/yaml-download-utils';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { BuildModel } from '../../models';
import { Build } from '../../types';
import BuildFormEditor from './BuildFormEditor';
import { convertBuildFormDataToYAML, convertBuildToFormData } from './form-utils';
import { BuildFormikValues } from './types';

type BuildFormProp = {
  heading: string;
  build: Build;
  handleCancel: () => void;
} & FormikProps<BuildFormikValues>;

const LAST_VIEWED_EDITOR_TYPE_USERSETTING_KEY = 'shipwright.buildForm.editor.lastView';

const BuildForm: React.FC<BuildFormProp> = ({
  handleSubmit,
  heading,
  build: watchedBuild,
  values,
  handleCancel,
  setFieldValue,
  setStatus,
  setErrors,
  status,
  dirty,
  isSubmitting,
  errors,
}) => {
  const { t } = useTranslation();
  const { ns } = useParams();
  const isNew = !watchedBuild?.metadata?.name;
  const isStale = !isNew && watchedBuild?.metadata?.resourceVersion !== values.resourceVersion;

  const namespace = watchedBuild?.metadata?.namespace || ns;

  const formEditor = <BuildFormEditor namespace={namespace} />;
  const yamlEditor = (
    <CodeEditorField name="yamlData" model={BuildModel} showSamples={isNew} onSave={handleSubmit} />
  );
  const onReload = React.useCallback(() => {
    setStatus({ submitSuccess: '', submitError: '' });
    setErrors({});
    if (values.editorType === EditorType.Form) {
      setFieldValue('formData', convertBuildToFormData(watchedBuild, values).formData, false);
    }
    setFieldValue('yamlData', safeJSToYAML(watchedBuild, '', { skipInvalid: true }), false);
    setFieldValue('resourceVersion', watchedBuild?.metadata?.resourceVersion, true);
    setFieldValue('formReloadCount', values.formReloadCount + 1);
  }, [setFieldValue, setStatus, setErrors, watchedBuild, values]);

  const sanitizeToForm = (yamlbuild: Build) => convertBuildToFormData(yamlbuild, values).formData;

  const sanitizeToYaml = () => convertBuildFormDataToYAML(values);

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
        handleReset={isNew ? null : onReload}
        errorMessage={status?.submitError}
        successMessage={status?.submitSuccess}
        showAlert={isStale}
        infoTitle={t('shipwright-plugin~This object has been updated.')}
        infoMessage={t('shipwright-plugin~Click reload to see the new version.')}
        isSubmitting={isSubmitting}
        submitLabel={isNew ? t('shipwright-plugin~Create') : t('shipwright-plugin~Save')}
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

export default BuildForm;
