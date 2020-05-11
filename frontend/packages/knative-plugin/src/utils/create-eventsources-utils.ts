import * as _ from 'lodash';
import { safeLoad } from 'js-yaml';
import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import {
  getAppLabels,
  getCommonAnnotations,
} from '@console/dev-console/src/utils/resource-label-utils';

import {
  EventSources,
  EventSourceFormData,
  NormalizedEventSources,
} from '../components/add/import-types';
import { ServiceModel } from '../models';
import { getKnativeEventSourceIcon } from './get-knative-icon';
import { getEventSourceModels } from './fetch-dynamic-eventsources-utils';

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
    sink: { knativeService },
  } = formData;

  const defaultLabel = getAppLabels(name, applicationName);
  const eventSrcData = data[type.toLowerCase()];
  const eventSourceResource: K8sResourceKind = {
    kind: type,
    apiVersion,
    metadata: {
      name,
      namespace,
      labels: {
        ...defaultLabel,
      },
      annotations: getCommonAnnotations(),
    },
    spec: {
      sink: {
        ref: {
          apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
          kind: ServiceModel.kind,
          name: knativeService,
        },
      },
      ...(eventSrcData && eventSrcData),
    },
  };

  return eventSourceResource;
};

export const getKafkaSourceResource = (formData: EventSourceFormData): K8sResourceKind => {
  const {
    limits: { cpu, memory },
  } = formData;
  const baseResource = getEventSourcesDepResource(formData);
  const kafkaSource = {
    spec: {
      resources: {
        ...((cpu.limit || memory.limit) && {
          limits: {
            ...(cpu.limit && { cpu: `${cpu.limit}${cpu.limitUnit}` }),
            ...(memory.limit && { memory: `${memory.limit}${memory.limitUnit}` }),
          },
        }),
        ...((cpu.request || memory.request) && {
          requests: {
            ...(cpu.request && { cpu: `${cpu.request}${cpu.requestUnit}` }),
            ...(memory.request && { memory: `${memory.request}${memory.requestUnit}` }),
          },
        }),
      },
    },
  };
  return _.merge({}, baseResource, kafkaSource);
};

export const getContainerSourceResource = (formData: EventSourceFormData): K8sResourceKind => {
  const baseResource = _.omit(getEventSourcesDepResource(formData), ['spec.containers']);
  const containersourceData = {
    spec: {
      template: {
        spec: {
          containers: _.map(formData.data.containersource?.containers, (container) => {
            return {
              image: container.image,
              name: container.name,
              args: container.args.map((arg) => arg.name),
              env: container.env,
            };
          }),
        },
      },
    },
  };

  return _.merge({}, baseResource, containersourceData);
};
export const getEventSourceResource = (formData: EventSourceFormData): K8sResourceKind => {
  switch (formData.type) {
    case EventSources.KafkaSource:
      return getKafkaSourceResource(formData);
    case EventSources.ContainerSource:
      return getContainerSourceResource(formData);
    case EventSources.CronJobSource:
    case EventSources.ApiServerSource:
    case EventSources.SinkBinding:
    case EventSources.PingSource:
      return getEventSourcesDepResource(formData);
    default:
      return safeLoad(formData.yamlData);
  }
};

export const getEventSourceData = (source: string) => {
  const eventSourceData = {
    cronjobsource: {
      data: '',
      schedule: '',
    },
    pingsource: {
      data: '',
      schedule: '',
    },
    sinkbinding: {
      subject: {
        apiVersion: '',
        kind: '',
        selector: {
          matchLabels: {},
        },
      },
    },
    apiserversource: {
      mode: 'Ref',
      serviceAccountName: '',
      resources: [
        {
          apiVersion: '',
          kind: '',
        },
      ],
    },
    kafkasource: {
      bootstrapServers: '',
      topics: '',
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
      serviceAccountName: '',
    },
    containersource: {
      containers: [
        {
          image: '',
          name: '',
          args: [{ name: '' }],
          env: [],
        },
      ],
    },
  };
  return eventSourceData[source];
};

export const useKnativeEventingAccess = (model: K8sKind, namespace: string): boolean => {
  const canCreateEventSource = useAccessReview({
    group: model.apiGroup,
    resource: model.plural,
    namespace,
    verb: 'create',
  });
  return canCreateEventSource;
};

export const useEventSourceList = (namespace: string): NormalizedEventSources => {
  const eventSourceList = _.reduce(
    getEventSourceModels(),
    (accumulator, eventSourceModel) => {
      // Defined extensions are immutable. This check will be consistent.
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const checkAccessVal = useKnativeEventingAccess(eventSourceModel, namespace);
      return {
        ...accumulator,
        ...(checkAccessVal && {
          [eventSourceModel.kind]: {
            name: eventSourceModel.kind,
            iconUrl: getKnativeEventSourceIcon(eventSourceModel.kind),
            displayName: eventSourceModel.kind,
            title: eventSourceModel.kind,
          },
        }),
      };
    },
    {},
  );
  return eventSourceList;
};
