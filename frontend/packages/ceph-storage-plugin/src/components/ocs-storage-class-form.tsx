import * as React from 'react';
import { Dropdown, DropdownItem, DropdownToggle, Alert } from '@patternfly/react-core';
import { CaretDownIcon } from '@patternfly/react-icons';

import { ProvisionerProps } from '@console/plugin-sdk';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';

import { cephBlockPoolResource } from '../constants/resources';

export const PoolResourceComponent: React.FC<ProvisionerProps> = ({ onParamChange }) => {
  const [poolData, poolDataLoaded, poolDataLoadError] = useK8sWatchResource<K8sResourceKind[]>(
    cephBlockPoolResource,
  );
  const [isOpen, setOpen] = React.useState<boolean>(false);
  const [poolName, setPoolName] = React.useState<string>(null);

  const handleDropdownChange = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const name = e.currentTarget.id;
    setPoolName(name);
    onParamChange(name);
  };

  const poolDropdownItems = poolData?.map((pool) => (
    <DropdownItem
      key={pool.metadata.uid}
      component="button"
      id={pool?.metadata?.name}
      onClick={handleDropdownChange}
    >
      {pool?.metadata?.name}
    </DropdownItem>
  ));

  return (
    <>
      {!poolDataLoadError && (
        <div className="form-group">
          <label className="co-required" htmlFor="ocs-storage-pool">
            Pool
          </label>
          <Dropdown
            title="Select Pool"
            className="dropdown dropdown--full-width"
            toggle={
              <DropdownToggle
                id="toggle-id"
                onToggle={() => setOpen(!isOpen)}
                toggleIndicator={CaretDownIcon}
              >
                {poolName || 'Select a Pool'}
              </DropdownToggle>
            }
            isOpen={isOpen}
            dropdownItems={poolDropdownItems}
            onSelect={() => setOpen(false)}
            id="ocs-storage-pool"
          />
          <span className="help-block">Ceph pool into which volume data shall be stored</span>
        </div>
      )}
      {poolDataLoaded && poolDataLoadError && (
        <Alert className="co-alert" variant="danger" title="Error retrieving Pools" isInline />
      )}
    </>
  );
};
