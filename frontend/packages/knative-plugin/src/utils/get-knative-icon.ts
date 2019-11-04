import * as openshiftImg from '@console/internal/imgs/logos/openshift.svg';
import * as apiServerSourceImg from '../imgs/logos/apiserversource.png';
import * as camelSourceImg from '../imgs/logos/camelsource.svg';
import * as containerSourceImg from '../imgs/logos/containersource.png';
import * as cronJobSourceImg from '../imgs/logos/cronjobsource.png';
import * as kafkaSourceImg from '../imgs/logos/kafkasource.svg';

export const getKnativeEventSourceIcon = (kind: string): string => {
  switch (kind) {
    case 'ApiServerSource':
      return apiServerSourceImg;
    case 'CamelSource':
      return camelSourceImg;
    case 'ContainerSource':
      return containerSourceImg;
    case 'CronJobSource':
      return cronJobSourceImg;
    case 'KafkaSource':
      return kafkaSourceImg;
    default:
      return openshiftImg;
  }
};
