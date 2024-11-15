import * as React from 'react';
import { LaptopCodeIcon, GitAltIcon } from '@patternfly/react-icons';
import serverlessFunctionIcon from '@console/internal/imgs/logos/serverlessfx.svg';
import channelIcon from '../imgs/channel.svg';
import eventSinkIcon from '../imgs/event-sink.svg';
import eventSourceIcon from '../imgs/event-source.svg';

export const eventIconStyle: React.CSSProperties = {
  width: '1em',
  height: '1em',
};
export const eventSourceIconSVG = eventSourceIcon;

export const eventSinkIconSVG = eventSinkIcon;

export const channelIconSVG = channelIcon;

export const serverlessFunctionSVG = serverlessFunctionIcon;

export const gitIconElement = <GitAltIcon />;

export const samplesIconElement = <LaptopCodeIcon />;

export const EventSinkIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <img src={eventSinkIcon} style={style} alt="Event Sink logo" />
);

export const EventSourceIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <img src={eventSourceIcon} style={style} alt="Event Source logo" />
);

export const ServerlessFunctionIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <img src={serverlessFunctionIcon} style={style} alt="Serverless function logo" />
);
