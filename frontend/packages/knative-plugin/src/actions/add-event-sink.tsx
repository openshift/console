import * as React from 'react';
import i18next from 'i18next';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import { Action } from '@console/dynamic-plugin-sdk';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import * as eventSourceImg from '../imgs/event-source.svg';

const eventSinkIconStyle = {
  width: '1em',
  height: '1em',
};
const EventSourceIcon: React.FC = () => {
  return <img style={eventSinkIconStyle} src={eventSourceImg} alt="Event Sink logo" />;
};

export const AddEventSinkAction = (
  namespace: string,
  application?: string,
  contextSource?: string,
  path?: string,
): Action => {
  const params = new URLSearchParams();
  const pageUrl = `/catalog/ns/${namespace}`;
  params.append('catalogType', 'EventSink');
  contextSource && params.append(QUERY_PROPERTIES.CONTEXT_SOURCE, contextSource);
  application
    ? params.append(QUERY_PROPERTIES.APPLICATION, application)
    : params.append(QUERY_PROPERTIES.APPLICATION, UNASSIGNED_KEY);
  return {
    id: 'event-sink-add',
    label: i18next.t('knative-plugin~Event Sink'),
    icon: <EventSourceIcon />,
    cta: {
      href: `${pageUrl}?${params.toString()}`,
    },
    path,
    insertAfter: 'upload-jar',
  };
};
