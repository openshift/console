import * as React from 'react';
import * as channelIcon from '../imgs/channel.svg';
import * as eventSinkIcon from '../imgs/event-sink.svg';
import * as eventSourceIcon from '../imgs/event-source.svg';

export const eventIconStyle: React.CSSProperties = {
  width: '1em',
  height: '1em',
};
export const eventSourceIconSVG = eventSourceIcon;

export const eventSinkIconSVG = eventSinkIcon;

export const channelIconSVG = channelIcon;

export const EventSinkIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <img src={eventSinkIcon} style={style} alt="Event Sink logo" />
);

export const EventSourceIcon: React.FC<{ style?: React.CSSProperties }> = ({ style }) => (
  <img src={eventSourceIcon} style={style} alt="Event Source logo" />
);
