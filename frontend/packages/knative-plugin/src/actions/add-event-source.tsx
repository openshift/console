import * as React from 'react';
import {
  createKebabAction,
  KebabAction,
} from '@console/dev-console/src/utils/add-resources-menu-utils';
import { ImportOptions } from '@console/dev-console/src/components/import/import-types';
import * as eventSourceImg from '../imgs/event-source.svg';

const eventSourceIconStyle = {
  width: '1em',
  height: '1em',
};
const EventSourceIcon: React.FC = () => {
  return <img style={eventSourceIconStyle} src={eventSourceImg} alt="" />;
};

export const addEventSource: KebabAction = createKebabAction(
  'Event Source',
  <EventSourceIcon />,
  ImportOptions.EVENTSOURCE,
);
