import * as React from 'react';
import { Formik, FormikHelpers } from 'formik';
import { useTranslation } from 'react-i18next';
import { history, resourcePathFromModel } from '@console/internal/components/utils';
import { k8sCreate, k8sUpdate } from '@console/internal/module/k8s';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML, safeYAMLToJS } from '@console/shared/src/utils/yaml';
import BuildConfigForm from './BuildConfigForm';
import {
  validationSchema,
  convertBuildConfigToFormData,
  convertFormDataToBuildConfig,
} from './form-utils';
import { BuildConfigFormikValues } from './form-utils/types';
import { BuildConfig, BuildConfigModel } from './types';

export interface EditBuildConfigProps {
  heading: string;
  namespace: string;
  name: string;
  buildConfig: BuildConfig;
}

const EditBuildConfig: React.FC<EditBuildConfigProps> = ({
  heading,
  namespace,
  name,
  buildConfig: watchedBuildConfig,
}) => {
  const { t } = useTranslation();

  const [initialValues] = React.useState<BuildConfigFormikValues>(() => {
    const values = convertBuildConfigToFormData(watchedBuildConfig);
    values.yamlData = safeJSToYAML(watchedBuildConfig, '', { skipInvalid: true });
    values.resourceVersion = watchedBuildConfig?.metadata?.resourceVersion;
    values.formReloadCount = 0;
    return values;
  });

  const handleSubmit = async (
    values: BuildConfigFormikValues,
    helpers: FormikHelpers<BuildConfigFormikValues>,
  ): Promise<void> => {
    let parsedBuildConfig: BuildConfig;
    try {
      // Use YAML also as base when submitting the form
      parsedBuildConfig = safeYAMLToJS(values.yamlData);
      if (!parsedBuildConfig?.metadata?.namespace) {
        parsedBuildConfig.metadata.namespace = namespace;
      }
    } catch (err) {
      helpers.setStatus({
        submitSuccess: '',
        submitError: t('devconsole~Invalid YAML - {{err}}', { err }),
      });
      return;
    }

    const changedBuildConfig =
      values.editorType === EditorType.Form
        ? convertFormDataToBuildConfig(parsedBuildConfig, values)
        : parsedBuildConfig;

    try {
      const isNew = !name || name === '~new';
      const updatedBuildConfig: BuildConfig = isNew
        ? await k8sCreate<BuildConfig>(BuildConfigModel, changedBuildConfig)
        : await k8sUpdate<BuildConfig>(BuildConfigModel, changedBuildConfig, namespace, name);

      history.push(
        resourcePathFromModel(
          BuildConfigModel,
          updatedBuildConfig.metadata.name,
          updatedBuildConfig.metadata.namespace,
        ),
      );
    } catch (err) {
      helpers.setStatus({ submitSuccess: '', submitError: err.message });
    }
  };

  const handleCancel = () => history.goBack();

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema()}
      enableReinitialize
    >
      {(formikProps) => {
        return (
          <BuildConfigForm
            {...formikProps}
            heading={heading}
            buildConfig={watchedBuildConfig}
            handleCancel={handleCancel}
          />
        );
      }}
    </Formik>
  );
};

export default EditBuildConfig;
