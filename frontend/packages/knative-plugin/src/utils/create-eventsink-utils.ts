import * as _ from 'lodash';
import {
  getAppLabels,
  getCommonAnnotations,
} from '@console/dev-console/src/utils/resource-label-utils';
import { K8sResourceKind } from '@console/internal/module/k8s/types';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { UNASSIGNED_APPLICATIONS_KEY } from '@console/shared/src/constants';
import { CREATE_APPLICATION_KEY } from '@console/topology/src/const';
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

export const sanitizeSinkToForm = (
  newFormData: K8sResourceKind,
  formDataValues: EventSinkFormData,
  kameletSink?: K8sResourceKind,
) => {
  const specData = newFormData.spec;
  const appGroupName = newFormData.metadata?.labels?.['app.kubernetes.io/part-of'];
  const formData = {
    ...formDataValues,
    application: {
      ...formDataValues.application,
      ...(appGroupName &&
        appGroupName !== formDataValues.application.name && {
          name: appGroupName,
          selectedKey: formDataValues.application.selectedKey ? CREATE_APPLICATION_KEY : '',
        }),
      ...(!appGroupName && {
        name: '',
        selectedKey: UNASSIGNED_APPLICATIONS_KEY,
      }),
    },
    name: newFormData.metadata?.name,
    sourceType: specData?.source?.ref ? SinkType.Resource : SinkType.Uri,
    sink: {
      apiVersion: specData?.sink?.ref?.apiVersion,
      kind: specData?.sink?.ref?.kind,
      name: specData?.sink?.ref?.name,
      key: `${specData?.sink?.ref?.kind}-${specData?.sink?.ref?.name}`,
      uri: specData?.sink?.uri || '',
    },
    data: {
      [formDataValues.type]: {
        ..._.omit(specData, 'source'),
      },
      ...(kameletSink && {
        [formDataValues.type]: {
          sink: {
            ref: {
              apiVersion: kameletSink.apiVersion,
              kind: kameletSink.kind,
              name: kameletSink.metadata.name,
            },
            properties: specData?.sink?.properties,
          },
        },
      }),
    },
  };
  return formData;
};
