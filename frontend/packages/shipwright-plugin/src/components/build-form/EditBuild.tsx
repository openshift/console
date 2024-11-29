import * as React from 'react';
import { Formik, FormikHelpers } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { history, resourcePathFromModel } from '@console/internal/components/utils';
import { k8sCreate, k8sUpdate } from '@console/internal/module/k8s';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML, safeYAMLToJS } from '@console/shared/src/utils/yaml';
import { BuildModel } from '../../models';
import { Build } from '../../types';
import BuildForm from './BuildForm';
import { convertBuildToFormData, convertFormDataToBuild } from './form-utils';
import { BuildFormikValues } from './types';
import { validationSchema } from './validation';

type EditBuildProps = {
  name: string;
  heading: string;
  namespace: string;
  build: Build;
};

const EditBuild: React.FC<EditBuildProps> = ({ heading, build: watchedBuild, namespace, name }) => {
  const { t } = useTranslation();
  const [initialValues] = React.useState<BuildFormikValues>(() => {
    const values = convertBuildToFormData(watchedBuild);
    values.yamlData = safeJSToYAML(watchedBuild, '', { skipInvalid: true });
    values.resourceVersion = watchedBuild?.metadata?.resourceVersion;
    values.formReloadCount = 0;
    return values;
  });

  const handleSubmit = async (
    values: BuildFormikValues,
    helpers: FormikHelpers<BuildFormikValues>,
  ): Promise<void> => {
    let parsedBuild: Build;
    try {
      // Use YAML also as base when submitting the form
      parsedBuild = safeYAMLToJS(values.yamlData);
      if (!parsedBuild?.metadata?.namespace) {
        parsedBuild.metadata.namespace = namespace;
      }
    } catch (err) {
      helpers.setStatus({
        submitSuccess: '',
        submitError: t('shipwright-plugin~Invalid YAML - {{err}}', { err }),
      });
      return;
    }

    const changedBuild =
      values.editorType === EditorType.Form
        ? convertFormDataToBuild(parsedBuild, values)
        : parsedBuild;
    const buildParams = changedBuild?.spec?.paramValues;
    const filterEmptyValueParams = buildParams?.filter(
      (param) => !_.isEmpty(param.value) || !_.isEmpty(param.values),
    );
    changedBuild.spec.paramValues = filterEmptyValueParams;
    try {
      const isNew = !name;
      const updatedBuildConfig: Build = isNew
        ? await k8sCreate<Build>(BuildModel, changedBuild)
        : await k8sUpdate<Build>(BuildModel, changedBuild, namespace, name);

      history.push(
        resourcePathFromModel(
          BuildModel,
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
      validationSchema={validationSchema()}
      onSubmit={handleSubmit}
      enableReinitialize
    >
      {(formikProps) => {
        return (
          <BuildForm
            {...formikProps}
            heading={heading}
            build={watchedBuild}
            handleCancel={handleCancel}
          />
        );
      }}
    </Formik>
  );
};

export default EditBuild;
