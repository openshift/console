import * as React from 'react';
import i18next from 'i18next';
import { QUERY_PROPERTIES } from '@console/dev-console/src/const';
import { Action } from '@console/dynamic-plugin-sdk/src';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import * as channelIcon from '../imgs/channel.svg';

const eventBrokerStyles = {
  width: '1em',
  height: '1em',
};
const EventBrokerIcon: React.FC = () => (
  <img style={eventBrokerStyles} src={channelIcon} alt="Eventking Broker icon" />
);

export const AddBrokerAction = (namespace: string, application?: string, path?: string): Action => {
  const params = new URLSearchParams();
  const pageUrl = `/broker/ns/${namespace}`;
  application
    ? params.append(QUERY_PROPERTIES.APPLICATION, application)
    : params.append(QUERY_PROPERTIES.APPLICATION, UNASSIGNED_KEY);
  return {
    id: 'broker-add',
    label: i18next.t('knative-plugin~Broker'),
    icon: <EventBrokerIcon />,
    cta: {
      href: `${pageUrl}?${params.toString()}`,
    },
    path,
    insertAfter: 'channel-add',
  };
};
