import * as React from 'react';
import { List, ListItem, Expandable, Text, TextVariants } from '@patternfly/react-core';
import { BootableDeviceType } from '../../types';
import { deviceLabel, deviceKey, bootOrderEmptyTitle, bootOrderEmptyMessage } from './constants';

import './boot-order-summary.scss';

export const BootOrderSummaryEmptyState = ({ devices }: BootOrderSummaryEmptyStateProps) => {
  const [isExpanded, setIsExpanded] = React.useState<boolean>(false);

  const options = devices.filter((device) => !device.value.bootOrder);

  const onToggle = () => {
    setIsExpanded(!isExpanded);
  };

  // Note(Yaacov): className='text-secondary' is a hack to fix TextVariants being overriden.
  return (
    <>
      <Text component={TextVariants.p} className="kubevirt-boot-order-summary__empty-text">
        {bootOrderEmptyTitle}
      </Text>
      <Text component={TextVariants.small} className="text-secondary">
        {bootOrderEmptyMessage}
      </Text>
      {options.length > 0 && (
        <Expandable
          toggleText={isExpanded ? 'Hide default boot disks' : 'Show default boot disks'}
          onToggle={onToggle}
          isExpanded={isExpanded}
          className="kubevirt-boot-order-summary__expandable"
        >
          <List>
            {options.map((option) => (
              <ListItem key={deviceKey(option)}>{deviceLabel(option)}</ListItem>
            ))}
          </List>
        </Expandable>
      )}
    </>
  );
};

export type BootOrderSummaryEmptyStateProps = {
  devices: BootableDeviceType[];
};
