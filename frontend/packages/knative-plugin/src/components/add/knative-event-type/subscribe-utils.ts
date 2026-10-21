import * as _ from 'lodash';
import type { K8sResourceKind } from '@console/internal/module/k8s';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import { craftResourceKey, getResourceNameFromKey } from '../../pub-sub/pub-sub-utils';

export const convertYamlToForm = (triggerYaml: K8sResourceKind, values) => {
  const trigger = _.cloneDeep(triggerYaml);
  values.formData = {
    apiVersion: trigger?.apiVersion,
    kind: trigger?.kind,
    metadata: {
      name: trigger.metadata?.name,
      namespace: trigger.metadata?.namespace,
    },
    spec: {
      broker: trigger?.spec?.broker,
      subscriber: {
        ref: {
          ...trigger?.spec?.subscriber.ref,
          name: craftResourceKey(trigger?.spec?.subscriber?.ref?.name, {
            kind: trigger?.spec?.subscriber?.ref?.kind,
            apiVersion: trigger?.spec?.subscriber?.ref?.apiVersion,
          }),
        },
      },
      filter: trigger.spec?.filter,
    },
  };
  return values;
};

export const convertFormToTriggerYaml = (triggerFormData): K8sResourceKind => {
  const parsedTrigger = safeYAMLToJS(triggerFormData.yamlData);
  parsedTrigger.metadata = triggerFormData.formData.metadata;
  parsedTrigger.spec.broker = triggerFormData.formData?.spec?.broker;
  parsedTrigger.spec.filter = triggerFormData.formData.spec.filter;
  parsedTrigger.spec.subscriber = triggerFormData.formData.spec.subscriber;
  parsedTrigger.spec.subscriber.ref.name = getResourceNameFromKey(
    triggerFormData?.formData.spec?.subscriber?.ref?.name,
  );
  return parsedTrigger;
};
