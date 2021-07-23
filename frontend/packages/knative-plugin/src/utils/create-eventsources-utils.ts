import * as _ from 'lodash';
import {
  getAppLabels,
  getCommonAnnotations,
} from '@console/dev-console/src/utils/resource-label-utils';
import { checkAccess, history } from '@console/internal/components/utils';
import {
  K8sResourceKind,
  referenceForModel,
  referenceFor,
  modelFor,
  K8sKind,
} from '@console/internal/module/k8s';
import {
  Descriptor,
  SpecCapability,
} from '@console/operator-lifecycle-manager/src/components/descriptors/types';
import { Perspective } from '@console/plugin-sdk';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import { UNASSIGNED_APPLICATIONS_KEY } from '@console/shared/src/constants';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import { CREATE_APPLICATION_KEY } from '@console/topology/src/const';
import { getEventSourceCatalogProviderData } from '../catalog/event-source-data';
import {
  EventSources,
  EventSourceFormData,
  EventSourceSyncFormData,
  SinkType,
  EventSourceMetaData,
} from '../components/add/import-types';
import { CAMEL_K_PROVIDER_ANNOTATION } from '../const';
import { CamelKameletModel } from '../models';
import { getEventSourceIcon } from './get-knative-icon';

export const isKnownEventSource = (eventSource: string): boolean =>
  Object.keys(EventSources).includes(eventSource);

export const getEventSourcesDepResource = (formData: EventSourceFormData): K8sResourceKind => {
  const {
    type,
    name,
    apiVersion,
    application: { name: applicationName },
    project: { name: namespace },
    data,
    sinkType,
    sink,
  } = formData;

  const defaultLabel = getAppLabels({ name, applicationName });
  const eventSrcData = data[type];
  const { name: sinkName, kind: sinkKind, apiVersion: sinkApiVersion, uri: sinkUri } = sink;
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
      ...(sinkType === SinkType.Resource && sinkName && sinkApiVersion && sinkKind
        ? {
            sink: {
              ref: {
                apiVersion: sinkApiVersion,
                kind: sinkKind,
                name: sinkName,
              },
            },
          }
        : {
            sink: {
              uri: sinkUri,
            },
          }),
    },
  };

  return eventSourceResource;
};

export const isSecretKeyRefPresent = (dataObj: {
  secretKeyRef: { name: string; key: string };
}): boolean => !!(dataObj?.secretKeyRef?.name || dataObj?.secretKeyRef?.key);

export const getKafkaSourceResource = (sourceFormData: any): K8sResourceKind => {
  const baseResource = getEventSourcesDepResource(sourceFormData.formData);
  const { net } = baseResource.spec;
  baseResource.spec.net = {
    ...net,
    ...(!net.sasl?.enable && { sasl: { user: {}, password: {} } }),
    ...(net.sasl?.enable &&
      !isSecretKeyRefPresent(net.sasl?.user) &&
      !isSecretKeyRefPresent(net.sasl?.password) && {
        sasl: { enable: true, user: {}, password: {} },
      }),
    ...(!net.tls?.enable && { tls: { caCert: {}, cert: {}, key: {} } }),
    ...(net.tls?.enable &&
      !isSecretKeyRefPresent(net.tls?.caCert) &&
      !isSecretKeyRefPresent(net.tls?.cert) &&
      !isSecretKeyRefPresent(net.tls?.key) && {
        tls: { enable: true, caCert: {}, cert: {}, key: {} },
      }),
  };
  return baseResource;
};

export const loadYamlData = (formData: EventSourceSyncFormData) => {
  const {
    formData: {
      project: { name: namespace },
    },
    yamlData,
  } = formData;
  let yamlDataObj = safeYAMLToJS(yamlData);
  const modelData = yamlDataObj && modelFor(referenceFor(yamlDataObj));
  if (yamlDataObj?.metadata && modelData?.namespaced && !yamlDataObj.metadata?.namespace) {
    yamlDataObj = { ...yamlDataObj, metadata: { ...yamlDataObj.metadata, namespace } };
  }
  return yamlDataObj;
};

export const getCatalogEventSourceResource = (
  sourceFormData: EventSourceSyncFormData,
): K8sResourceKind => {
  if (sourceFormData.editorType === EditorType.YAML) {
    return loadYamlData(sourceFormData);
  }
  switch (sourceFormData.formData.type) {
    case EventSources.KafkaSource:
      return getKafkaSourceResource(sourceFormData);
    default:
      return getEventSourcesDepResource(sourceFormData.formData);
  }
};

export const getEventSourceData = (source: string) => {
  const eventSourceData = {
    [EventSources.CronJobSource]: {
      data: '',
      schedule: '',
    },
    [EventSources.PingSource]: {
      jsonData: '',
      schedule: '',
    },
    [EventSources.SinkBinding]: {
      subject: {
        apiVersion: '',
        kind: '',
        selector: {
          matchLabels: {},
        },
      },
    },
    [EventSources.ApiServerSource]: {
      mode: 'Reference',
      serviceAccountName: '',
      resources: [
        {
          apiVersion: '',
          kind: '',
        },
      ],
    },
    [EventSources.KafkaSource]: {
      bootstrapServers: [],
      topics: [],
      consumerGroup: '',
      net: {
        sasl: {
          enable: false,
          user: { secretKeyRef: { name: '', key: '' } },
          password: { secretKeyRef: { name: '', key: '' } },
        },
        tls: {
          enable: false,
          caCert: { secretKeyRef: { name: '', key: '' } },
          cert: { secretKeyRef: { name: '', key: '' } },
          key: { secretKeyRef: { name: '', key: '' } },
        },
      },
    },
    [EventSources.ContainerSource]: {
      template: {
        spec: {
          containers: [
            {
              image: '',
              name: '',
              args: [''],
              env: [],
            },
          ],
        },
      },
    },
  };
  return eventSourceData[source];
};

export const getKameletSourceData = (kameletData: K8sResourceKind) => ({
  source: {
    ref: {
      apiVersion: kameletData.apiVersion,
      kind: kameletData.kind,
      name: kameletData.metadata.name,
    },
    properties: {},
  },
});

export const sanitizeKafkaSourceResource = (formData: EventSourceFormData): EventSourceFormData => {
  const formDataActual = formData.data?.[EventSources.KafkaSource] || {};
  const initialSecretKeyData = { secretKeyRef: { name: '', key: '' } };
  return {
    ...formData,
    data: {
      [EventSources.KafkaSource]: {
        bootstrapServers: Array.isArray(formDataActual.bootstrapServers)
          ? formDataActual.bootstrapServers
          : [],
        topics: Array.isArray(formDataActual.topics) ? formDataActual.topics : [],
        consumerGroup:
          typeof formDataActual.consumerGroup === 'string' ? formDataActual.consumerGroup : '',
        net: {
          sasl: {
            enable:
              typeof formDataActual.net?.sasl?.enable === 'boolean'
                ? formDataActual.net?.sasl?.enable
                : false,
            user:
              typeof formDataActual.net?.sasl?.user === 'object'
                ? { ...initialSecretKeyData, ...formDataActual.net.sasl.user }
                : initialSecretKeyData,
            password:
              typeof formDataActual.net?.sasl?.password === 'object'
                ? { ...initialSecretKeyData, ...formDataActual.net.sasl.password }
                : initialSecretKeyData,
          },
          tls: {
            enable:
              typeof formDataActual.net?.tls?.enable === 'boolean'
                ? formDataActual.net?.tls?.enable
                : false,
            caCert:
              typeof formDataActual.net?.tls?.caCert === 'object'
                ? { ...initialSecretKeyData, ...formDataActual.net.tls.caCert }
                : initialSecretKeyData,
            cert:
              typeof formDataActual.net?.tls?.cert === 'object'
                ? { ...initialSecretKeyData, ...formDataActual.net.tls.cert }
                : initialSecretKeyData,
            key:
              typeof formDataActual.net?.tls?.key === 'object'
                ? { ...initialSecretKeyData, ...formDataActual.net.tls.key }
                : initialSecretKeyData,
          },
        },
      },
    },
  };
};

export const getKameletMetadata = (kamelet: K8sResourceKind): EventSourceMetaData => {
  let normalizedKamelet = {};
  if (kamelet?.kind === CamelKameletModel.kind) {
    const {
      kind,
      metadata: { annotations },
      spec: {
        definition: { title, description },
      },
    } = kamelet;
    const provider = annotations?.[CAMEL_K_PROVIDER_ANNOTATION] || '';
    const iconUrl = getEventSourceIcon(kind, kamelet);
    normalizedKamelet = {
      name: title,
      description,
      provider,
      iconUrl,
    };
  }
  return normalizedKamelet as EventSourceMetaData;
};

export const getEventSourceMetadata = (eventSourceModel: K8sKind, t): EventSourceMetaData => {
  let normalizedSource = {};
  if (eventSourceModel) {
    const { kind, label: name } = eventSourceModel;
    const { description, provider } = getEventSourceCatalogProviderData(kind, t) ?? {};
    normalizedSource = {
      name,
      description,
      provider,
      iconUrl: getEventSourceIcon(referenceForModel(eventSourceModel)),
    };
  }
  return normalizedSource as EventSourceMetaData;
};

export const getEventSourceModelsWithAccess = (
  namespace: string,
  eventSourceModels: K8sKind[],
): Promise<K8sKind>[] => {
  return eventSourceModels.map((model) => {
    const { apiGroup, plural } = model;
    return checkAccess({
      group: apiGroup,
      resource: plural,
      namespace,
      verb: 'create',
    })
      .then((result) => (result.status.allowed ? model : null))
      .catch(() => null);
  });
};

export const getBootstrapServers = (kafkaResources: K8sResourceKind[]) => {
  const servers = kafkaResources?.reduce((acc, kafka) => {
    const listners = [
      ...(kafka?.status?.listeners
        ? kafka.status.listeners.map((l) => l?.bootstrapServers?.split(','))?.flat()
        : []),
      ...(kafka?.status?.bootstrapServerHost ? [kafka.status.bootstrapServerHost] : []),
    ];
    acc.push(...listners);
    return acc;
  }, []);
  return servers;
};

export const handleRedirect = (
  project: string,
  perspective: string,
  perspectiveExtensions: Perspective[],
) => {
  const perspectiveData = perspectiveExtensions.find((item) => item.properties.id === perspective);
  const redirectURL = perspectiveData.properties.getImportRedirectURL(project);
  history.push(redirectURL);
};

export const sanitizeSourceToForm = (
  newFormData: K8sResourceKind,
  formDataValues: EventSourceFormData,
  kameletSource?: K8sResourceKind,
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
    sinkType: specData?.sink?.ref ? SinkType.Resource : SinkType.Uri,
    sink: {
      apiVersion: specData?.sink?.ref?.apiVersion,
      kind: specData?.sink?.ref?.kind,
      name: specData?.sink?.ref?.name,
      key: `${specData?.sink?.ref?.kind}-${specData?.sink?.ref?.name}`,
      uri: specData?.sink?.uri || '',
    },
    data: {
      [formDataValues.type]: {
        ..._.omit(specData, 'sink'),
      },
      ...(kameletSource && {
        [formDataValues.type]: {
          source: {
            ref: {
              apiVersion: kameletSource.apiVersion,
              kind: kameletSource.kind,
              name: kameletSource.metadata.name,
            },
            properties: specData?.source?.properties,
          },
        },
      }),
    },
  };
  return formDataValues.type === EventSources.KafkaSource
    ? sanitizeKafkaSourceResource(formData)
    : formData;
};

export const formDescriptorData = (
  properties,
  descriptorArr = [],
  path = '',
): Descriptor<SpecCapability>[] => {
  for (const k in properties) {
    if (properties.hasOwnProperty(k) && typeof properties[k] === 'object') {
      const custPath = path !== '' ? `${path}.${k}` : k;
      if (properties[k].type === 'object') {
        formDescriptorData(properties[k].properties, descriptorArr, custPath);
      } else if (properties[k].type === 'array' && properties[k].items) {
        if (properties[k].items.type === 'object') {
          formDescriptorData(properties[k].items.properties, descriptorArr, `${custPath}[0]`);
        } else if (properties[k].items.type === 'array') {
          formDescriptorData(properties[k].items, descriptorArr, `${custPath}[0]`);
        } else {
          descriptorArr.push({
            ...(properties[k].items.hasOwnProperty('title') && {
              displayName: properties[k].items.title,
            }),
            ...(properties[k].items.hasOwnProperty('description') && {
              description: properties[k].items.description,
            }),
            path: `${custPath}[0]`,
            ...(properties[k].items.hasOwnProperty('x-descriptors') && {
              'x-descriptors': properties[k].items['x-descriptors'],
            }),
          });
        }
      } else {
        descriptorArr.push({
          displayName: properties[k].title,
          description: properties[k].description,
          path: custPath,
          ...(properties[k]['x-descriptors'] && {
            'x-descriptors': properties[k]['x-descriptors'],
          }),
        });
      }
    }
  }
  return descriptorArr;
};
