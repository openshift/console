import * as React from 'react';
import { kindForReference, K8sResourceKind } from '@console/internal/module/k8s';
import { isValidUrl } from '@console/shared';
import {
  EVENT_SOURCE_ICON,
  CAMEL_KAMELET_ICON,
  EVENT_SOURCE_SINK_BINDING_KIND,
  EVENT_SOURCE_KAFKA_KIND,
  EVENT_SOURCE_CAMEL_KIND,
  EVENT_SOURCE_API_SERVER_KIND,
  EVENT_SOURCE_CONTAINER_KIND,
  EVENT_SOURCE_PING_KIND,
  EVENT_SINK_KAFKA_KIND,
} from '../const';
import * as apiServerSourceImg from '../imgs/logos/apiserversource.svg';
import * as camelSourceImg from '../imgs/logos/camelsource.svg';
import * as containerSourceImg from '../imgs/logos/containersource.svg';
import * as kafkaSourceImg from '../imgs/logos/kafkasource.svg';
import * as pingSourceImg from '../imgs/logos/pingsource.svg';
import * as sinkBindingSourceImg from '../imgs/logos/sinkbindingsource.svg';
import { TYPE_EVENT_SINK } from '../topology/const';
import { eventSinkIconSVG, eventSourceIconSVG } from './icons';

const getEventSourceIconFromKind = (kind: string, nodeType?: string): React.ReactNode | string => {
  switch (kindForReference(kind)) {
    case EVENT_SOURCE_API_SERVER_KIND:
      return apiServerSourceImg;
    case EVENT_SOURCE_CAMEL_KIND:
      return camelSourceImg;
    case EVENT_SOURCE_CONTAINER_KIND:
      return containerSourceImg;
    case EVENT_SOURCE_PING_KIND:
      return pingSourceImg;
    case EVENT_SOURCE_KAFKA_KIND:
      return kafkaSourceImg;
    case EVENT_SOURCE_SINK_BINDING_KIND:
      return sinkBindingSourceImg;
    case EVENT_SINK_KAFKA_KIND:
      return kafkaSourceImg;
    default:
      return nodeType === TYPE_EVENT_SINK ? eventSinkIconSVG : eventSourceIconSVG;
  }
};

export const getEventSourceIcon = (
  kind: string,
  obj?: K8sResourceKind,
  nodeType?: string,
): React.ReactNode | string => {
  const objAnnotations = obj?.metadata?.annotations;
  return isValidUrl(objAnnotations?.[EVENT_SOURCE_ICON])
    ? objAnnotations?.[EVENT_SOURCE_ICON]
    : isValidUrl(objAnnotations?.[CAMEL_KAMELET_ICON])
    ? objAnnotations?.[CAMEL_KAMELET_ICON]
    : getEventSourceIconFromKind(kind, nodeType);
};
