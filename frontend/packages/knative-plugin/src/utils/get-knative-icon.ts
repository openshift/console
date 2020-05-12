import { kindForReference } from '@console/internal/module/k8s';
import * as apiServerSourceImg from '../imgs/logos/apiserversource.png';
import * as camelSourceImg from '../imgs/logos/camelsource.svg';
import * as containerSourceImg from '../imgs/logos/containersource.png';
import * as cronJobSourceImg from '../imgs/logos/cronjobsource.svg';
import * as kafkaSourceImg from '../imgs/logos/kafkasource.svg';
import * as eventSourceImg from '../imgs/event-source.svg';
import {
  EventSourceCronJobModel,
  EventSourceContainerModel,
  EventSourceApiServerModel,
  EventSourceCamelModel,
  EventSourceKafkaModel,
  EventSourcePingModel,
} from '../models';

export const getKnativeEventSourceIcon = (kind: string): string => {
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
    default:
      return eventSourceImg;
  }
};
