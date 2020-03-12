import { referenceForModel } from '@console/internal/module/k8s';
import * as openshiftImg from '@console/internal/imgs/logos/openshift.svg';
import * as apiServerSourceImg from '../imgs/logos/apiserversource.png';
import * as camelSourceImg from '../imgs/logos/camelsource.svg';
import * as containerSourceImg from '../imgs/logos/containersource.png';
import * as cronJobSourceImg from '../imgs/logos/cronjobsource.png';
import * as kafkaSourceImg from '../imgs/logos/kafkasource.svg';
import {
  EventSourceCronJobModel,
  EventSourceContainerModel,
  EventSourceApiServerModel,
  EventSourceCamelModel,
  EventSourceKafkaModel,
  EventSourceServiceBindingModel,
} from '../models';

export const getKnativeEventSourceIcon = (kind: string): string => {
  switch (kind) {
    case referenceForModel(EventSourceApiServerModel):
      return apiServerSourceImg;
    case referenceForModel(EventSourceCamelModel):
      return camelSourceImg;
    case referenceForModel(EventSourceContainerModel):
      return containerSourceImg;
    case referenceForModel(EventSourceCronJobModel):
      return cronJobSourceImg;
    case referenceForModel(EventSourceKafkaModel):
      return kafkaSourceImg;
    case referenceForModel(EventSourceServiceBindingModel):
      return containerSourceImg;
    default:
      return openshiftImg;
  }
};
