import * as React from 'react';
import i18next from 'i18next';
import { ImportOptions } from '@console/dev-console/src/components/import/import-types';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import {
  createKebabAction,
  KebabAction,
} from '@console/dev-console/src/utils/add-resources-menu-utils';
import { Action } from '@console/dynamic-plugin-sdk';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import * as eventSourceImg from '../imgs/event-source.svg';

const eventSourceIconStyle = {
  width: '1em',
  height: '1em',
};
const EventSourceIcon: React.FC = () => {
  return <img style={eventSourceIconStyle} src={eventSourceImg} alt="" />;
};

export const AddEventSourceAction = (
  namespace: string,
  application?: string,
  contextSource?: string,
  path?: string,
): Action => {
  const params = new URLSearchParams();
  const pageUrl = `/catalog/ns/${namespace}`;
  params.append('catalogType', 'EventSource');
  contextSource && params.append(QUERY_PROPERTIES.CONTEXT_SOURCE, contextSource);
  application
    ? params.append(QUERY_PROPERTIES.APPLICATION, application)
    : params.append(QUERY_PROPERTIES.APPLICATION, UNASSIGNED_KEY);
  return {
    id: 'event-source-add',
    label: i18next.t('knative-plugin~Event Source'),
    icon: <EventSourceIcon />,
    cta: {
      href: `${pageUrl}?${params.toString()}`,
    },
    path,
    insertAfter: ['upload-jar'],
  };
};

/**
 * @deprecated this action has been migration to use new Action extensions, use AddEventSourceAction
 */
export const addEventSource: { id: string; action: KebabAction } = {
  id: 'knative-event-source',
  action: createKebabAction(
    // t('knative-plugin~Event Source')
    'knative-plugin~Event Source',
    <EventSourceIcon />,
    ImportOptions.EVENTSOURCE,
  ),
};
