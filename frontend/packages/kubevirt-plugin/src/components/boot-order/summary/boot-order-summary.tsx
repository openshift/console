import * as React from 'react';
import * as _ from 'lodash';
import { BootableDeviceType } from '../../../types';
import { deviceKey, deviceLabel } from '../constants';
import { BootOrderEmptySummary } from './boot-order-empty-summary';

// NOTE(yaacov): using <ol> because '@patternfly/react-core' <List> currently miss isOrder parameter.
export const BootOrderSummary: React.FC<BootOrderSummaryProps> = ({ devices }) => {
  const sources = _.sortBy(
    devices.filter((device) => device.value.bootOrder),
    'value.bootOrder',
  );

  return (
    <>
      {sources.length === 0 ? (
        <BootOrderEmptySummary devices={devices} />
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
