import * as React from 'react';
import { Flex, FlexItem, Grid, GridItem, TitleSizes } from '@patternfly/react-core';
import classNames from 'classnames';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useFlag } from '@console/shared';
import { FLAG_KUBEVIRT_HAS_PRINTABLESTATUS } from '../../../flags/const';
import { EmptyStateNoVMs } from '../../EmptyState/EmptyStateNoVMs';
import { useVmStatusResources } from '../../vm-status/use-vm-status-resources';
import { getVMStatusString } from '../utils';
import { VMStatusInventoryItem } from './VMStatusInventoryItem';

import './virt-overview-inventory-card.scss';

const LoadingElement: React.FC = () => (
  <div className="co-inventory-card__status">
    <div className="skeleton-status co-inventory-card__status" />
  </div>
);

const LoadingComponent: React.FC = () => (
  <Grid hasGutter className="kv-inventory-card__statuses-grid skeleton-box">
    <GridItem span={6} className="kv-inventory-card__statuses-grid--left-col">
      <Flex direction={{ default: 'column' }}>
        <LoadingElement />
        <LoadingElement />
        <LoadingElement />
      </Flex>
    </GridItem>
    <GridItem span={6}>
      <Flex direction={{ default: 'column' }}>
        <LoadingElement />
        <LoadingElement />
        <LoadingElement />
      </Flex>
    </GridItem>
  </Grid>
);

const getVMStatusCounts = (vms, statusResources, printableVmStatusFlag) => {
  const statusCounts = {};
  vms.forEach((vmLike) => {
    const status = getVMStatusString(vmLike, statusResources, printableVmStatusFlag);
    const count = statusCounts[status] || 0;
    statusCounts[status] = count + 1;
  });

  return statusCounts;
};

export type VMStatusesSectionProps = {
  vms: K8sResourceKind[];
  vmsLoaded: boolean;
};

export const VMStatusesSection: React.FC<VMStatusesSectionProps> = ({ vms, vmsLoaded }) => {
  const printableVmStatusFlag = useFlag(FLAG_KUBEVIRT_HAS_PRINTABLESTATUS);
  const statusResources = useVmStatusResources(undefined);
  const statusCounts = getVMStatusCounts(vms, statusResources, printableVmStatusFlag);

  const statusItems = [];
  for (const [key, value] of Object.entries(statusCounts)) {
    const status = key as string;
    const count = value as number;
    statusItems.push(
      <FlexItem key={`${status}-${count}`}>
        <VMStatusInventoryItem status={status} count={count} />
      </FlexItem>,
    );
  }

  const numStatuses = statusItems.length;
  const leftColumnStatusItems = statusItems.splice(Math.floor(statusItems.length / 2));

  return (
    <>
      {!vmsLoaded && <LoadingComponent />}
      {numStatuses === 0 && vmsLoaded && <EmptyStateNoVMs titleSize={TitleSizes.md} />}
      {numStatuses > 0 && vmsLoaded && (
        <Grid hasGutter className="kv-inventory-card__statuses-grid">
          <GridItem
            span={6}
            className={classNames({
              'kv-inventory-card__statuses-grid--left-col': numStatuses >= 2,
            })}
          >
            <Flex direction={{ default: 'column' }}>{leftColumnStatusItems}</Flex>
          </GridItem>
          <GridItem span={6}>
            <Flex direction={{ default: 'column' }}>{statusItems}</Flex>
          </GridItem>
        </Grid>
      )}
    </>
  );
};
