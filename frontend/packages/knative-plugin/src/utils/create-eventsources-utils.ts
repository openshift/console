import * as React from 'react';
import * as _ from 'lodash';
import {
  K8sResourceKind,
  referenceForModel,
  referenceFor,
  modelFor,
  K8sKind,
} from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { checkAccess, history } from '@console/internal/components/utils';
import { safeYAMLToJS } from '@console/shared/src/utils/yaml';
import { parseALMExamples, ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import {
  getAppLabels,
  getCommonAnnotations,
} from '@console/dev-console/src/utils/resource-label-utils';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { Perspective } from '@console/plugin-sdk';
import { EditorType } from '@console/shared/src/components/synced-editor/editor-toggle';
import {
  EventSources,
  EventSourceFormData,
  EventSourceSyncFormData,
  EventSourceListData,
  SinkType,
  EventSourceList,
  NormalizedEventSources,
} from '../components/add/import-types';
import { getEventSourceIcon } from './get-knative-icon';
import { clusterServiceVersionResource } from './get-knative-resources';
import { useEventSourceModels } from './fetch-dynamic-eventsources-utils';
import {
  EventSourceContainerModel,
  EventSourceApiServerModel,
  EventSourceSinkBindingModel,
  EventSourceCamelModel,
  EventSourcePingModel,
  EventSourceKafkaModel,
  EventSourceCronJobModel,
} from '../models';
import { EVENT_SOURCE_LABEL } from '../const';

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

export const getKafkaSourceResource = (sourceFormData: any): K8sResourceKind => {
  const baseResource = getEventSourcesDepResource(sourceFormData.formData);
  const { net } = baseResource.spec;
  baseResource.spec.net = {
    ...net,
    ...(!net.sasl?.enable && { sasl: { user: {}, password: {} } }),
    ...(!net.tls?.enable && { tls: { caCert: {}, cert: {}, key: {} } }),
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

export const getEventSourceResource = (
  sourceFormData: EventSourceSyncFormData,
): K8sResourceKind => {
  switch (sourceFormData.formData.type) {
    case EventSources.KafkaSource:
      return getKafkaSourceResource(sourceFormData);
    case EventSources.ContainerSource:
    case EventSources.CronJobSource:
    case EventSources.ApiServerSource:
    case EventSources.SinkBinding:
    case EventSources.PingSource:
      return getEventSourcesDepResource(sourceFormData.formData);
    default:
      return loadYamlData(sourceFormData);
  }
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

export const getEventSourceConnectorList = (
  namespace: string,
  csvData: ClusterServiceVersionKind[],
) =>
  _.reduce(
    csvData,
    (acm, cv) => {
      const parseCSVData = parseALMExamples(cv, false);
      _.forEach(parseCSVData, (res) => {
        if (
          _.findIndex(acm, res) === -1 &&
          referenceFor(res) === referenceForModel(EventSourceCamelModel) &&
          res?.metadata?.labels?.[EVENT_SOURCE_LABEL] === 'true'
        ) {
          const { apiGroup, plural, kind } = modelFor(referenceFor(res));
          const {
            metadata: { name },
          } = res;
          const modelData = {
            [name]: {
              name,
              iconUrl: getEventSourceIcon(kind, res),
              displayName: _.startCase(name),
              title: _.startCase(name),
              data: { almData: res },
            },
          };
          acm.push(
            checkAccess({
              group: apiGroup,
              resource: plural,
              namespace,
              verb: 'create',
            }).then((result) => (result.status.allowed ? modelData : {})),
          );
        }
      });
      return acm;
    },
    [],
  );

export const getEventSourceList = (namespace: string, eventSourceModels: K8sKind[]) => {
  const accessList = [];
  eventSourceModels.map((model) => {
    const { apiGroup, plural, kind } = model;
    const modelData = {
      [kind]: {
        name: kind,
        iconUrl: getEventSourceIcon(kind),
        displayName: _.startCase(kind),
        title: _.startCase(kind),
        provider: isKnownEventSource(kind) ? 'Red Hat' : '',
      },
    };
    return accessList.push(
      checkAccess({
        group: apiGroup,
        resource: plural,
        namespace,
        verb: 'create',
      }).then((result) => (result.status.allowed ? modelData : {})),
    );
  });
  return accessList;
};

// To order sources with known followed by CamelSource, followed by camelConnector and other dynamic sources
export const sortSourcesData = (sourcesObj: NormalizedEventSources): NormalizedEventSources => {
  const sortSourcesList: EventSourceList[] = _.orderBy(
    Object.values(sourcesObj),
    ['name'],
    ['asc'],
  );
  const knownSourcesKind = [
    EventSourceApiServerModel.kind,
    EventSourceContainerModel.kind,
    EventSourceCronJobModel.kind,
    EventSourceKafkaModel.kind,
    EventSourcePingModel.kind,
    EventSourceSinkBindingModel.kind,
  ];
  const knownSourcesList = _.filter(sortSourcesList, (source) =>
    knownSourcesKind.includes(source.name),
  );
  const camelSourcesList = _.filter(
    sortSourcesList,
    (source) => EventSourceCamelModel.kind === source?.name,
  );
  const dynamicCamelConnectorsList = _.filter(
    sortSourcesList,
    (source) =>
      !knownSourcesKind.includes(source.name) &&
      source.name !== EventSourceCamelModel.kind &&
      !!source.data,
  );
  const dynamicSourcesList = _.filter(
    sortSourcesList,
    (source) =>
      !knownSourcesKind.includes(source.name) &&
      source.name !== EventSourceCamelModel.kind &&
      !source?.data,
  );

  return [
    ...knownSourcesList,
    ...camelSourcesList,
    ...dynamicCamelConnectorsList,
    ...dynamicSourcesList,
  ].reduce((accumulator, currentValue) => {
    accumulator[currentValue.name] = currentValue;
    return accumulator;
  }, {});
};

export const useEventSourceList = (namespace: string): EventSourceListData => {
  const [accessData, setAccessData] = useSafetyFirst({ loaded: false, eventSourceList: {} });
  const { eventSourceModels, loaded: modelLoaded } = useEventSourceModels();
  const getCSVResources = React.useMemo(
    () => ({
      ...clusterServiceVersionResource(namespace),
    }),
    [namespace],
  );
  const [csvData, csvDataLoaded] = useK8sWatchResource<ClusterServiceVersionKind[]>(
    getCSVResources,
  );

  React.useEffect(() => {
    const eventSourcesList = getEventSourceList(namespace, eventSourceModels);
    const camelConnectorSourceList = getEventSourceConnectorList(namespace, csvData);
    if (modelLoaded && csvDataLoaded) {
      Promise.all([...eventSourcesList, ...camelConnectorSourceList])
        .then((results) => {
          const eventSourceList = results.reduce((acc, result) => {
            return { ...acc, ...result };
          }, {});
          setAccessData({ loaded: true, eventSourceList: sortSourcesData(eventSourceList) });
        })
        // eslint-disable-next-line no-console
        .catch((err) => console.warn(err.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelLoaded, csvDataLoaded]);
  return eventSourceModels.length === 0 && accessData.loaded
    ? { loaded: true, eventSourceList: null }
    : accessData;
};

export const getBootstrapServers = (kafkaResources: K8sResourceKind[]) => {
  const servers = [];
  _.forEach(kafkaResources, (kafka) => {
    const listeners = kafka?.status?.listeners;
    _.map(listeners, (l) => {
      servers.push(..._.split(l?.bootstrapServers, ','));
    });
  });
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
