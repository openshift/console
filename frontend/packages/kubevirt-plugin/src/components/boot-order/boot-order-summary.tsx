import * as React from 'react';
import * as _ from 'lodash';
import { BootableDeviceType } from '../../types';
import { deviceLabel, deviceKey } from './constants';
import { BootOrderSummaryEmptyState } from './boot-order-summary-empty-state';

// NOTE(yaacov): using <ol> because '@patternfly/react-core' <List> currently miss isOrder parameter.
export const BootOrderSummary: React.FC<BootOrderSummaryProps> = ({ devices }) => {
  const sources = _.sortBy(devices.filter((device) => device.value.bootOrder), 'value.bootOrder');

  return (
    <>
      {sources.length === 0 ? (
        <BootOrderSummaryEmptyState devices={devices} />
      ) : (
        <ol>
          {sources.map((source) => (
            <li key={deviceKey(source)}>{deviceLabel(source)}</li>
          ))}
        </ol>
      )}
    </>
  );
};

export type BootOrderSummaryProps = {
  devices: BootableDeviceType[];
};
