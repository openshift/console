import * as _ from 'lodash';
import {
  getAppLabels,
  getCommonAnnotations,
} from '@console/dev-console/src/utils/resource-label-utils';
import { referenceForModel } from '@console/internal/module/k8s';
import { K8sModel, K8sResourceKind } from '@console/internal/module/k8s/types';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { UNASSIGNED_APPLICATIONS_KEY } from '@console/shared/src/constants';
import { CREATE_APPLICATION_KEY } from '@console/topology/src/const';
import { getEventSinkCatalogProviderData } from '../catalog/event-sink-data';
import {
  EventSinkFormData,
  EventSinkSyncFormData,
  KnEventCatalogMetaData,
} from '../components/add/import-types';
import { craftResourceKey } from '../components/pub-sub/pub-sub-utils';
import { EVENT_SINK_KAFKA_KIND } from '../const';
import { loadYamlData } from './create-eventsources-utils';
import { getEventSourceIcon } from './get-knative-icon';

export const getEventSinksDepResource = (formData: EventSinkFormData): K8sResourceKind => {
  const {
    type,
    name,
    apiVersion,
    application: { name: applicationName },
    project: { name: namespace },
    data,
    source,
  } = formData;

  const defaultLabel = getAppLabels({ name, applicationName });
  const eventSrcData = data[type];
  const { name: sourceName, kind: sourceKind, apiVersion: sourceApiVersion } = source ?? {};
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
      ...(sourceName &&
        sourceApiVersion &&
        sourceKind && {
          source: {
            ref: {
              apiVersion: sourceApiVersion,
              kind: sourceKind,
              name: sourceName,
            },
          },
        }),
    },
  };

  return eventSourceResource;
};

export const getKafkaSinkResource = (formData: EventSinkFormData): K8sResourceKind => {
  const baseResource = getEventSinksDepResource(formData);
  return {
    ...baseResource,
    spec: {
      ..._.omit(baseResource.spec, 'auth'),
      ...(baseResource.spec?.auth?.secret?.ref?.name && {
        auth: {
          secret: {
            ref: {
              name: baseResource.spec?.auth?.secret?.ref?.name,
            },
          },
        },
      }),
    },
  };
};

export const getCatalogEventSinkResource = (
  sourceFormData: EventSinkSyncFormData,
): K8sResourceKind => {
  if (sourceFormData.editorType === EditorType.YAML) {
    return loadYamlData(sourceFormData);
  }
  const { formData } = sourceFormData;
  return formData.type === EVENT_SINK_KAFKA_KIND
    ? getKafkaSinkResource(formData)
    : getEventSinksDepResource(formData);
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

export const sanitizeKafkaSinkResource = (formData: EventSinkFormData): EventSinkFormData => {
  const formDataActual = formData.data?.[EVENT_SINK_KAFKA_KIND] || {};
  return {
    ...formData,
    data: {
      [EVENT_SINK_KAFKA_KIND]: {
        bootstrapServers: Array.isArray(formDataActual.bootstrapServers)
          ? formDataActual.bootstrapServers
          : [],
        topic: formDataActual.topic ?? '',
        ...(formDataActual.auth?.secret?.ref?.name && {
          auth: {
            secret: {
              ref: {
                name: formDataActual.auth?.secret?.ref?.name,
              },
            },
          },
        }),
      },
    },
  };
};

export const sanitizeSinkToForm = (
  newFormData: K8sResourceKind,
  formDataValues: EventSinkFormData,
  kameletSink?: K8sResourceKind,
): EventSinkFormData => {
  const specData = newFormData.spec;
  const { ref: sourceRef } = specData?.source || {};
  const appGroupName = newFormData.metadata?.labels?.['app.kubernetes.io/part-of'];
  const formData: EventSinkFormData = {
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
    ...(sourceRef?.name &&
      sourceRef?.kind &&
      sourceRef?.apiVersion && {
        source: {
          apiVersion: sourceRef.apiVersion,
          kind: sourceRef.kind,
          name: sourceRef.name,
          key: craftResourceKey(sourceRef.name, sourceRef),
        },
      }),
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
  return formDataValues.type === EVENT_SINK_KAFKA_KIND
    ? sanitizeKafkaSinkResource(formData)
    : formData;
};

export const getEventSinkMetadata = (eventSinkModel: K8sModel, t): KnEventCatalogMetaData => {
  let normalizedSource = {};
  if (eventSinkModel) {
    const { kind, label: name } = eventSinkModel;
    const { description, provider } = getEventSinkCatalogProviderData(kind, t) ?? {};
    normalizedSource = {
      name,
      description,
      provider,
      iconUrl: getEventSourceIcon(referenceForModel(eventSinkModel)),
    };
  }
  return normalizedSource as KnEventCatalogMetaData;
};

export const getEventSinkData = (sink: string) => {
  const eventSinkData = {
    [EVENT_SINK_KAFKA_KIND]: {
      bootstrapServers: [],
      topic: '',
      auth: {
        secret: {
          ref: {
            name: '',
          },
        },
      },
    },
  };
  return eventSinkData[sink];
};
