import * as React from 'react';
import { ImportOptions } from '@console/dev-console/src/components/import/import-types';
import {
  createKebabAction,
  KebabAction,
} from '@console/dev-console/src/utils/add-resources-menu-utils';
import * as eventSourceImg from '../imgs/event-source.svg';

const eventSourceIconStyle = {
  width: '1em',
  height: '1em',
};
const EventSourceIcon: React.FC = () => {
  return <img style={eventSourceIconStyle} src={eventSourceImg} alt="" />;
};

export const addEventSource: { id: string; action: KebabAction } = {
  id: 'knative-event-source',
  action: createKebabAction(
    // t('knative-plugin~Event Source')
    'knative-plugin~Event Source',
    <EventSourceIcon />,
    ImportOptions.EVENTSOURCE,
  ),
};
