import * as _ from 'lodash';
import { K8sResourceKind, K8sKind } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import { getAppLabels } from '@console/dev-console/src/utils/resource-label-utils';
import { annotations } from '@console/dev-console/src/utils/shared-submit-utils';
import { EventSources } from '../components/add/import-types';
import {
  ServiceModel,
  EventSourceCronJobModel,
  EventSourceSinkBindingModel,
  EventSourceApiServerModel,
  EventSourceCamelModel,
  EventSourceKafkaModel,
} from '../models';
import { KNATIVE_EVENT_SOURCE_APIGROUP, KNATIVE_EVENT_SOURCE_APIGROUP_DEP } from '../const';
import * as apiServerSourceImg from '../imgs/logos/apiserversource.png';
import * as camelSourceImg from '../imgs/logos/camelsource.svg';
import * as containerSourceImg from '../imgs/logos/containersource.png';
import * as cronJobSourceImg from '../imgs/logos/cronjobsource.png';
import * as kafkaSourceImg from '../imgs/logos/kafkasource.svg';

export const getEventSourcesDepResource = (formData: any): K8sResourceKind => {
  const {
    type,
    name,
    application: { name: applicationName },
    project: { name: namespace },
    data,
    sink: { knativeService },
    limits: { cpu, memory },
  } = formData;

  const defaultLabel = getAppLabels(name, applicationName);
  const apiGroup =
    type === EventSources.ApiServerSource ||
    type === EventSources.SinkBinding ||
    type === EventSources.KafkaSource
      ? KNATIVE_EVENT_SOURCE_APIGROUP
      : KNATIVE_EVENT_SOURCE_APIGROUP_DEP;
  const apiVersion = 'v1alpha1';
  const eventSrcData = data[type.toLowerCase()];
  const completeEventSrcData =
    type === EventSources.KafkaSource && eventSrcData
      ? _.merge({}, eventSrcData, {
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
        })
      : eventSrcData;
  const eventSourceResource: K8sResourceKind = {
    kind: type,
    apiVersion: `${apiGroup}/${apiVersion}`,
    metadata: {
      name,
      namespace,
      labels: {
        ...defaultLabel,
      },
      annotations,
    },
    spec: {
      sink: {
        ref: {
          apiVersion: `${ServiceModel.apiGroup}/${ServiceModel.apiVersion}`,
          kind: ServiceModel.kind,
          name: knativeService,
        },
      },
      ...(completeEventSrcData && completeEventSrcData),
    },
  };

  return eventSourceResource;
};

export const getEventSourceData = (source: string) => {
  const eventSourceData = {
    cronjobsource: {
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

export const useEventSourceList = (namespace: string) => {
  const eventSourceList = {
    ...(useKnativeEventingAccess(EventSourceCronJobModel, namespace) && {
      [EventSourceCronJobModel.kind]: {
        name: EventSourceCronJobModel.kind,
        iconUrl: cronJobSourceImg,
        displayName: EventSourceCronJobModel.label,
        title: EventSourceCronJobModel.kind,
      },
    }),
    ...(useKnativeEventingAccess(EventSourceSinkBindingModel, namespace) && {
      [EventSourceSinkBindingModel.kind]: {
        name: EventSourceSinkBindingModel.kind,
        iconUrl: containerSourceImg,
        displayName: EventSourceSinkBindingModel.label,
        title: EventSourceSinkBindingModel.kind,
      },
    }),
    ...(useKnativeEventingAccess(EventSourceApiServerModel, namespace) && {
      [EventSourceApiServerModel.kind]: {
        name: EventSourceApiServerModel.kind,
        iconUrl: apiServerSourceImg,
        displayName: EventSourceApiServerModel.label,
        title: EventSourceApiServerModel.kind,
      },
    }),
    ...(useKnativeEventingAccess(EventSourceKafkaModel, namespace) && {
      [EventSourceKafkaModel.kind]: {
        name: EventSourceKafkaModel.kind,
        iconUrl: kafkaSourceImg,
        displayName: EventSourceKafkaModel.label,
        title: EventSourceKafkaModel.kind,
      },
    }),
    ...(useKnativeEventingAccess(EventSourceCamelModel, namespace) && {
      [EventSourceCamelModel.kind]: {
        name: EventSourceCamelModel.kind,
        iconUrl: camelSourceImg,
        displayName: EventSourceCamelModel.label,
        title: EventSourceCamelModel.kind,
      },
    }),
  };
  return eventSourceList;
};
