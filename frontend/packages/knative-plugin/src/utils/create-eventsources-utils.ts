import * as React from 'react';
import * as _ from 'lodash';
import { safeLoad } from 'js-yaml';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { checkAccess } from '@console/internal/components/utils';
import {
  getAppLabels,
  getCommonAnnotations,
} from '@console/dev-console/src/utils/resource-label-utils';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import {
  EventSources,
  EventSourceFormData,
  EventSourceListData,
} from '../components/add/import-types';
import { ServiceModel } from '../models';
import { getKnativeEventSourceIcon } from './get-knative-icon';
import { useEventSourceModels } from './fetch-dynamic-eventsources-utils';

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
  const { net } = baseResource.spec;
  baseResource.spec.net = {
    ...net,
    ...(!net.sasl?.enable && { sasl: { user: {}, password: {} } }),
    ...(!net.tls?.enable && { tls: { caCert: {}, cert: {}, key: {} } }),
  };
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
      bootstrapServers: [''],
      topics: [''],
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

export const useEventSourceList = (namespace: string): EventSourceListData | null => {
  const [accessData, setAccessData] = useSafetyFirst({ loaded: false, eventSourceList: {} });
  const { eventSourceModels, loaded: modelLoaded } = useEventSourceModels();
  React.useEffect(() => {
    const accessList = [];
    if (modelLoaded) {
      eventSourceModels.map((model) => {
        const { apiGroup, plural, kind } = model;
        const modelData = {
          [model.kind]: {
            name: kind,
            iconUrl: getKnativeEventSourceIcon(kind),
            displayName: kind,
            title: kind,
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
      Promise.all(accessList)
        .then((results) => {
          const eventSourceList = results.reduce((acc, result) => {
            return { ...acc, ...result };
          }, {});
          setAccessData({ loaded: true, eventSourceList });
        })
        // eslint-disable-next-line no-console
        .catch((err) => console.warn(err.message));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelLoaded]);
  return eventSourceModels.length === 0 && modelLoaded ? null : accessData;
};
