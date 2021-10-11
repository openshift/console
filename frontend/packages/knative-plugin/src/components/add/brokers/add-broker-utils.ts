import { apiVersionForModel, K8sResourceKind } from '@console/internal/module/k8s';
import { UNASSIGNED_APPLICATIONS_KEY } from '@console/shared';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { safeJSToYAML } from '@console/shared/src/utils/yaml';
import { sanitizeApplicationValue } from '@console/topology/src/utils';
import { EventingBrokerModel } from '../../../models';
import { LABEL_PART_OF, EVENT_BROKER_APP, DEFAULT_BROKER_NAME } from '../const';
import { AddBrokerFormYamlValues, BrokerFormData } from '../import-types';

export const convertFormToBrokerYaml = (formData: BrokerFormData): K8sResourceKind => {
  const {
    name,
    project: { name: namespace },
    application: { selectedKey, name: appName = null },
    spec = {},
  } = formData;

  return {
    apiVersion: apiVersionForModel(EventingBrokerModel),
    kind: EventingBrokerModel.kind,
    metadata: {
      name,
      namespace,
      ...(appName &&
        selectedKey !== UNASSIGNED_APPLICATIONS_KEY && {
          labels: {
            [LABEL_PART_OF]: appName,
          },
        }),
    },
    spec,
  };
};

export const addBrokerInitialValues = (
  namespace: string,
  selectedApplication: string,
): AddBrokerFormYamlValues => {
  const initialFormData: BrokerFormData = {
    name: DEFAULT_BROKER_NAME,
    spec: {},
    project: {
      name: namespace || '',
      displayName: '',
      description: '',
    },
    application: {
      initial: sanitizeApplicationValue(selectedApplication),
      name: sanitizeApplicationValue(selectedApplication) || EVENT_BROKER_APP,
      selectedKey: selectedApplication,
    },
  };
  const initialYamlData: string = safeJSToYAML(
    convertFormToBrokerYaml(initialFormData),
    'yamlData',
    {
      skipInvalid: true,
    },
  );
  return {
    showCanUseYAMLMessage: true,
    editorType: EditorType.Form,
    yamlData: initialYamlData,
    formData: initialFormData,
  };
};
