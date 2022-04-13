import * as React from 'react';
import * as _ from 'lodash';
import { Formik, FormikHelpers } from 'formik';
import { k8sCreateResource, k8sUpdateResource } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import { ConfigMapModel } from '../../models';
import { history } from '../../components/utils';
import { ConfigMapFormEditor } from './ConfigMapFormEditor';
import { ConfigMap, ConfigMapFormInitialValues } from './types';
import { getConfigmapData, getConfigMapInitialValues, validationSchema } from './configmap-utils';

export interface ConfigMapProps {
  title: string;
  namespace: string;
  name: string;
  configMap: ConfigMap;
  isCreateFlow: boolean;
}

const ConfigmapForm: React.FC<ConfigMapProps> = ({
  name,
  namespace,
  title,
  configMap,
  isCreateFlow,
}) => {
  const [initialValues] = React.useState(
    getConfigMapInitialValues(namespace, configMap, isCreateFlow),
  );
  const handleSubmit = (
    values: ConfigMapFormInitialValues,
    actions: FormikHelpers<ConfigMapFormInitialValues>,
  ) => {
    let resourceCall;

    const configMapYaml: ConfigMap = safeYAMLToJS(values.yamlData);
    if (configMapYaml?.metadata && !configMapYaml?.metadata?.namespace) {
      configMapYaml.metadata.namespace = namespace;
    }
    const configmap: ConfigMap =
      values.editorType === EditorType.Form
        ? getConfigmapData(values, configMapYaml)
        : configMapYaml;
    if (isCreateFlow) {
      resourceCall = k8sCreateResource({ model: ConfigMapModel, data: configmap });
    } else {
      const editConfigMapData = _.cloneDeep(configMap);
      editConfigMapData.metadata = configmap?.metadata;
      editConfigMapData.data = configmap.data;
      editConfigMapData.binaryData = configmap.binaryData;
      editConfigMapData.immutable = configmap.immutable;

      resourceCall = k8sUpdateResource({
        model: ConfigMapModel,
        data: editConfigMapData,
        ns: namespace,
        name,
      });
    }
    resourceCall
      .then(() => {
        history.push(`/k8s/ns/${namespace}/configmaps/${configmap.metadata.name}`);
      })
      .catch((e) => {
        actions.setStatus({ submitError: e.message });
      });
  };

  const handleCancel = () => history.goBack();

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      onSubmit={handleSubmit}
      validationSchema={validationSchema()}
    >
      {(formikProps) => (
        <ConfigMapFormEditor
          title={title}
          configMap={configMap}
          handleCancel={handleCancel}
          {...formikProps}
        />
      )}
    </Formik>
  );
};

export default ConfigmapForm;
