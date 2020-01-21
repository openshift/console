import * as React from 'react';
import { Table } from '@console/internal/components/factory';
import { sortable } from '@patternfly/react-table';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { createBasicLookup, dimensifyHeader } from '@console/shared';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { VMLikeEntityKind, VMIKind } from '../../types';
import { getInterfaces, getNetworks, asVM, isVMI } from '../../selectors/vm';
import { VMLikeEntityTabProps } from '../vms/types';
import { NetworkInterfaceWrapper } from '../../k8s/wrapper/vm/network-interface-wrapper';
import { nicModalEnhanced } from '../modals/nic-modal/nic-modal-enhanced';
import { getSimpleName } from '../../selectors/utils';
import { NetworkWrapper } from '../../k8s/wrapper/vm/network-wrapper';
import { wrapWithProgress } from '../../utils/utils';
import { NicRow } from './nic-row';
import { NetworkBundle } from './types';
import { nicTableColumnClasses } from './utils';
import { getVMINetworks, getVMIInterfaces } from '../../selectors/vmi';

const getNicsData = (vmLikeEntity: VMLikeEntityKind, vmiProp?: VMIKind): NetworkBundle[] => {
  const vm = asVM(vmLikeEntity);
  const vmi = isVMI(vmLikeEntity) ? vmLikeEntity : vmiProp;

  const networks = vm ? getNetworks(vm) : getVMINetworks(vmi);
  const interfaces = vm ? getInterfaces(vm) : getVMIInterfaces(vmi);

  const networkLookup = createBasicLookup(networks, getSimpleName);

  return interfaces.map((nic) => {
    const network = networkLookup[nic.name];
    const interfaceWrapper = NetworkInterfaceWrapper.initialize(nic);
    const networkWrapper = NetworkWrapper.initialize(network);
    return {
      nic,
      network,
      // for sorting
      name: interfaceWrapper.getName(),
      model: interfaceWrapper.getReadableModel(),
      networkName: networkWrapper.getReadableName(),
      interfaceType: interfaceWrapper.getTypeValue(),
      macAddress: interfaceWrapper.getMACAddress(),
    };
  });
};

export type VMNicsTableProps = {
  data?: any[];
  customData?: object;
  row: React.ComponentClass<any, any> | React.ComponentType<any>;
  columnClasses: string[];
};

export const VMNicsTable: React.FC<VMNicsTableProps> = ({
  data,
  customData,
  row: Row,
  columnClasses,
}) => {
  return (
    <Table
      aria-label="VM Nics List"
      data={data}
      Header={() =>
        dimensifyHeader(
          [
            {
              title: 'Name',
              sortField: 'name',
              transforms: [sortable],
            },
            {
              title: 'Model',
              sortField: 'model',
              transforms: [sortable],
            },
            {
              title: 'Network',
              sortField: 'networkName',
              transforms: [sortable],
            },
            {
              title: 'Type',
              sortField: 'interfaceType',
              transforms: [sortable],
            },
            {
              title: 'MAC Address',
              sortField: 'macAddress',
              transforms: [sortable],
            },
            {
              title: '',
            },
          ],
          columnClasses,
        )
      }
      Row={Row}
      customData={{ ...customData, columnClasses }}
      virtualize
      loaded
    />
  );
};

export const VMNics: React.FC<VMLikeEntityTabProps> = ({ obj: vmLikeEntity, vmi }) => {
  const [isLocked, setIsLocked] = useSafetyFirst(false);
  const withProgress = wrapWithProgress(setIsLocked);
  return (
    <div className="co-m-list">
      {!isVMI(vmLikeEntity) && (
        <div className="co-m-pane__filter-bar">
          <div className="co-m-pane__filter-bar-group">
            <Button
              variant={ButtonVariant.primary}
              id="create-nic-btn"
              onClick={() =>
                withProgress(
                  nicModalEnhanced({
                    blocking: true,
                    vmLikeEntity,
                  }).result,
                )
              }
              isDisabled={isLocked}
            >
              Create Network Interface
            </Button>
          </div>
        </div>
      )}
      <div className="co-m-pane__body">
        <VMNicsTable
          data={getNicsData(vmLikeEntity, vmi)}
          customData={{
            vmLikeEntity,
            withProgress,
            isDisabled: isLocked,
          }}
          row={NicRow}
          columnClasses={nicTableColumnClasses}
        />
      </div>
    </div>
  );
};
