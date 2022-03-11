import * as _ from 'lodash';
import {
  getAppLabels,
  getCommonAnnotations,
} from '@console/dev-console/src/utils/resource-label-utils';
import { K8sResourceKind } from '@console/internal/module/k8s/types';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { UNASSIGNED_APPLICATIONS_KEY } from '@console/shared/src/constants';
import { CREATE_APPLICATION_KEY } from '@console/topology/src/const';
import { EventSinkFormData, EventSinkSyncFormData } from '../components/add/import-types';
import { craftResourceKey } from '../components/pub-sub/pub-sub-utils';
import { loadYamlData } from './create-eventsources-utils';

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
  const { name: sourceName, kind: sourceKind, apiVersion: sourceApiVersion } = source;
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
  return formData;
};
