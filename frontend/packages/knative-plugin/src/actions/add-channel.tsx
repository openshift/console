import * as React from 'react';
import {
  createKebabAction,
  KebabAction,
} from '@console/dev-console/src/utils/add-resources-menu-utils';
import { ImportOptions } from '@console/dev-console/src/components/import/import-types';
import * as channelIcon from '../imgs/channel.svg';

const eventChannelStyles = {
  width: '1em',
  height: '1em',
};
const EventChannelIcon: React.FC = () => {
  return <img style={eventChannelStyles} src={channelIcon} alt="" />;
};

export const addChannels: KebabAction = createKebabAction(
  'Channel',
  <EventChannelIcon />,
  ImportOptions.EVENTCHANNEL,
);
