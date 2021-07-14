import * as React from 'react';
import { ImportOptions } from '@console/dev-console/src/components/import/import-types';
import {
  createKebabAction,
  KebabAction,
} from '@console/dev-console/src/utils/add-resources-menu-utils';
import * as channelIcon from '../imgs/channel.svg';

const eventBrokerStyles = {
  width: '1em',
  height: '1em',
};
const EventBrokerIcon: React.FC = () => <img style={eventBrokerStyles} src={channelIcon} alt="" />;

export const addBrokers: { id: string; action: KebabAction } = {
  id: 'knative-eventing-broker',
  action: createKebabAction(
    // t('knative-plugin~Broker')
    'knative-plugin~Broker',
    <EventBrokerIcon />,
    ImportOptions.EVENTBROKER,
  ),
};
