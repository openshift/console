import { kindForReference, K8sResourceKind } from '@console/internal/module/k8s';
import { isValidUrl } from '@console/shared';
import { EVENT_SOURCE_ICON, CAMEL_KAMELET_ICON } from '../const';
import * as eventSourceImg from '../imgs/event-source.svg';
import * as apiServerSourceImg from '../imgs/logos/apiserversource.svg';
import * as camelSourceImg from '../imgs/logos/camelsource.svg';
import * as containerSourceImg from '../imgs/logos/containersource.svg';
import * as cronJobSourceImg from '../imgs/logos/cronjobsource.svg';
import * as kafkaSourceImg from '../imgs/logos/kafkasource.svg';
import * as sinkBindingSourceImg from '../imgs/logos/sinkbindingsource.svg';
import {
  EventSourceCronJobModel,
  EventSourceContainerModel,
  EventSourceApiServerModel,
  EventSourceCamelModel,
  EventSourceKafkaModel,
  EventSourcePingModel,
  EventSourceSinkBindingModel,
} from '../models';

const getEventSourceIconFromKind = (kind: string): string => {
  switch (kindForReference(kind)) {
    case EventSourceApiServerModel.kind:
      return apiServerSourceImg;
    case EventSourceCamelModel.kind:
      return camelSourceImg;
    case EventSourceContainerModel.kind:
      return containerSourceImg;
    case EventSourceCronJobModel.kind:
    case EventSourcePingModel.kind:
      return cronJobSourceImg;
    case EventSourceKafkaModel.kind:
      return kafkaSourceImg;
    case EventSourceSinkBindingModel.kind:
      return sinkBindingSourceImg;
    default:
      return eventSourceImg;
  }
};

export const getEventSourceIcon = (kind: string, obj?: K8sResourceKind) => {
  const objAnnotations = obj?.metadata?.annotations;
  return isValidUrl(objAnnotations?.[EVENT_SOURCE_ICON])
    ? objAnnotations?.[EVENT_SOURCE_ICON]
    : isValidUrl(objAnnotations?.[CAMEL_KAMELET_ICON])
    ? objAnnotations?.[CAMEL_KAMELET_ICON]
    : getEventSourceIconFromKind(kind);
};
