import {
  getAppLabels,
  getCommonAnnotations,
} from '@console/dev-console/src/utils/resource-label-utils';
import { K8sResourceKind } from '@console/internal/module/k8s/types';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { EventSinkFormData, EventSinkSyncFormData, SinkType } from '../components/add/import-types';
import { loadYamlData } from './create-eventsources-utils';

export const getEventSinksDepResource = (formData: EventSinkFormData): K8sResourceKind => {
  const {
    type,
    name,
    apiVersion,
    application: { name: applicationName },
    project: { name: namespace },
    data,
    sourceType,
    source,
  } = formData;

  const defaultLabel = getAppLabels({ name, applicationName });
  const eventSrcData = data[type];
  const {
    name: sourceName,
    kind: sourceKind,
    apiVersion: sourceApiVersion,
    uri: sourceUri,
  } = source;
  const eventSourceResource: K8sResourceKind = {
    apiVersion,
    kind: type,
    metadata: {
      name,
      namespace,
      labels: {
        ...defaultLabel,
      },
      annotations: getCommonAnnotations(),
    },
    spec: {
      ...(eventSrcData && eventSrcData),
      ...(sourceType === SinkType.Resource && sourceName && sourceApiVersion && sourceKind
        ? {
            source: {
              ref: {
                apiVersion: sourceApiVersion,
                kind: sourceKind,
                name: sourceName,
              },
            },
          }
        : {
            source: {
              uri: sourceUri,
            },
          }),
    },
  };

  return eventSourceResource;
};

export const getCatalogEventSinkResource = (
  sourceFormData: EventSinkSyncFormData,
): K8sResourceKind => {
  if (sourceFormData.editorType === EditorType.YAML) {
    return loadYamlData(sourceFormData);
  }
  const { formData } = sourceFormData;
  return getEventSinksDepResource(formData);
};

export const getKameletSinkData = (kameletData: K8sResourceKind) => ({
  sink: {
    ref: {
      apiVersion: kameletData.apiVersion,
      kind: kameletData.kind,
      name: kameletData.metadata.name,
    },
    properties: {},
  },
});
