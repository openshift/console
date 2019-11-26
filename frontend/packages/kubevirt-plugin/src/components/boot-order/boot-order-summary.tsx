import * as React from 'react';
import * as _ from 'lodash';
import { List, ListItem } from '@patternfly/react-core';
import { BootableDeviceType } from '../../types';
import { deviceLabel, deviceKey } from './constants';
import { BootOrderSummaryEmptyState } from './boot-order-summary-empty-state';

export const BootOrderSummary = ({ devices }: BootOrderSummaryProps) => {
  const sources = _.sortBy(devices.filter((device) => device.value.bootOrder), 'value.bootOrder');

  return (
    <>
      {sources.length === 0 ? (
        <BootOrderSummaryEmptyState devices={devices} />
      ) : (
        <List>
          {sources.map((source) => (
            <ListItem key={deviceKey(source)}>{deviceLabel(source)}</ListItem>
          ))}
        </List>
      )}
    </>
  );
};

export type BootOrderSummaryProps = {
  devices: BootableDeviceType[];
};
