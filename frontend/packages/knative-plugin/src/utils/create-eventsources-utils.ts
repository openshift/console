import * as React from 'react';
import * as _ from 'lodash';
import { safeLoad } from 'js-yaml';
import {
  K8sResourceKind,
  referenceForModel,
  referenceFor,
  modelFor,
  K8sKind,
} from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { checkAccess } from '@console/internal/components/utils';
import { parseALMExamples, ClusterServiceVersionKind } from '@console/operator-lifecycle-manager';
import {
  getAppLabels,
  getCommonAnnotations,
} from '@console/dev-console/src/utils/resource-label-utils';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import {
  EventSources,
  EventSourceFormData,
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
      ...(eventSrcData && eventSrcData),
    },
  };

  return eventSourceResource;
};

export const getKafkaSourceResource = (formData: EventSourceFormData): K8sResourceKind => {
  const baseResource = getEventSourcesDepResource(formData);
  const { net } = baseResource.spec;
  baseResource.spec.net = {
    ...net,
    ...(!net.sasl?.enable && { sasl: { user: {}, password: {} } }),
    ...(!net.tls?.enable && { tls: { caCert: {}, cert: {}, key: {} } }),
  };
  return baseResource;
};

export const loadYamlData = (formData: EventSourceFormData) => {
  const {
    project: { name: namespace },
    yamlData,
  } = formData;
  let yamlDataObj = safeLoad(yamlData);
  const modelData = yamlDataObj && modelFor(referenceFor(yamlDataObj));
  if (yamlDataObj?.metadata && modelData?.namespaced && !yamlDataObj.metadata?.namespace) {
    yamlDataObj = { ...yamlDataObj, metadata: { ...yamlDataObj.metadata, namespace } };
  }
  return yamlDataObj;
};

export const getEventSourceResource = (formData: EventSourceFormData): K8sResourceKind => {
  switch (formData.type) {
    case EventSources.KafkaSource:
      return getKafkaSourceResource(formData);
    case EventSources.ContainerSource:
    case EventSources.CronJobSource:
    case EventSources.ApiServerSource:
    case EventSources.SinkBinding:
    case EventSources.PingSource:
      return getEventSourcesDepResource(formData);
    default:
      return loadYamlData(formData);
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
      mode: 'Ref',
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

export const useEventSourceList = (namespace: string): EventSourceListData | null => {
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
  return eventSourceModels.length === 0 && accessData.loaded ? null : accessData;
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
