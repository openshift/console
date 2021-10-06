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
import * as channelIcon from '../imgs/channel.svg';

const eventChannelStyles = {
  width: '1em',
  height: '1em',
};
const EventChannelIcon: React.FC = () => (
  <img style={eventChannelStyles} src={channelIcon} alt="" />
);

export const AddChannelAction = (
  namespace: string,
  application?: string,
  path?: string,
): Action => {
  const params = new URLSearchParams();
  const pageUrl = `/channel/ns/${namespace}`;
  application
    ? params.append(QUERY_PROPERTIES.APPLICATION, application)
    : params.append(QUERY_PROPERTIES.APPLICATION, UNASSIGNED_KEY);
  return {
    id: 'channel-add',
    label: i18next.t('knative-plugin~Channel'),
    icon: <EventChannelIcon />,
    cta: {
      href: `${pageUrl}?${params.toString()}`,
    },
    path,
    insertAfter: ['event-source-add'],
  };
};

/**
 * @deprecated this action has been migration to use new Action extensions, use AddChannelAction
 */
export const addChannels: { id: string; action: KebabAction } = {
  id: 'knative-eventing-channel',
  action: createKebabAction(
    // t('knative-plugin~Channel')
    'knative-plugin~Channel',
    <EventChannelIcon />,
    ImportOptions.EVENTCHANNEL,
  ),
};
