import { K8sResourceKind } from '@console/internal/module/k8s';
import { useAccessReview } from '@console/internal/components/utils';
import { getActiveNamespace } from '@console/internal/actions/ui';
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
  } = formData;

  const defaultLabel = getAppLabels(name, applicationName);
  const apiGroup =
    type === EventSources.ApiServerSource || type === EventSources.SinkBinding
      ? KNATIVE_EVENT_SOURCE_APIGROUP
      : KNATIVE_EVENT_SOURCE_APIGROUP_DEP;
  const apiVersion = 'v1alpha1';
  const eventSrcData = data[type.toLowerCase()];
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
      ...(eventSrcData && eventSrcData),
    },
  };

  return eventSourceResource;
};

export const useKnativeEventingAccess = (model): boolean => {
  const canCreateEventSource = useAccessReview({
    group: model.apiGroup,
    resource: model.plural,
    namespace: getActiveNamespace(),
    verb: 'create',
  });
  return canCreateEventSource;
};

export const useEventSourceList = () => {
  const eventSourceList = {
    ...(useKnativeEventingAccess(EventSourceCronJobModel) && {
      [EventSourceCronJobModel.kind]: {
        name: EventSourceCronJobModel.kind,
        iconUrl: cronJobSourceImg,
        displayName: EventSourceCronJobModel.label,
        title: EventSourceCronJobModel.kind,
      },
    }),
    ...(useKnativeEventingAccess(EventSourceSinkBindingModel) && {
      [EventSourceSinkBindingModel.kind]: {
        name: EventSourceSinkBindingModel.kind,
        iconUrl: containerSourceImg,
        displayName: EventSourceSinkBindingModel.label,
        title: EventSourceSinkBindingModel.kind,
      },
    }),
    ...(useKnativeEventingAccess(EventSourceApiServerModel) && {
      [EventSourceApiServerModel.kind]: {
        name: EventSourceApiServerModel.kind,
        iconUrl: apiServerSourceImg,
        displayName: EventSourceApiServerModel.label,
        title: EventSourceApiServerModel.kind,
      },
    }),
    ...(useKnativeEventingAccess(EventSourceKafkaModel) && {
      [EventSourceKafkaModel.kind]: {
        name: EventSourceKafkaModel.kind,
        iconUrl: kafkaSourceImg,
        displayName: EventSourceKafkaModel.label,
        title: EventSourceKafkaModel.kind,
      },
    }),
    ...(useKnativeEventingAccess(EventSourceCamelModel) && {
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
