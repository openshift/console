import * as React from 'react';
import { Table, RowFunction } from '@console/internal/components/factory';
import { sortable } from '@patternfly/react-table';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { createBasicLookup, dimensifyHeader } from '@console/shared';
import { EmptyBox } from '@console/internal/components/utils';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { isVMI } from '../../selectors/vm';
import { VMLikeEntityTabProps } from '../vms/types';
import { NetworkInterfaceWrapper } from '../../k8s/wrapper/vm/network-interface-wrapper';
import { nicModalEnhanced } from '../modals/nic-modal/nic-modal-enhanced';
import { getSimpleName } from '../../selectors/utils';
import { NetworkWrapper } from '../../k8s/wrapper/vm/network-wrapper';
import { wrapWithProgress } from '../../utils/utils';
import { NicRow } from './nic-row';
import { NetworkBundle } from './types';
import { nicTableColumnClasses } from './utils';
import { asVMILikeWrapper } from '../../k8s/wrapper/utils/convert';
import { ADD_NETWORK_INTERFACE } from '../../utils/strings';

const getNicsData = (vmLikeEntity: VMGenericLikeEntityKind): NetworkBundle[] => {
  const vmiLikeWrapper = asVMILikeWrapper(vmLikeEntity);

  const networks = vmiLikeWrapper?.getNetworks() || [];
  const interfaces = vmiLikeWrapper?.getInterfaces() || [];

  const networkLookup = createBasicLookup(networks, getSimpleName);

  return interfaces.map((nic) => {
    const network = networkLookup[nic.name];
    const interfaceWrapper = new NetworkInterfaceWrapper(nic);
    const networkWrapper = new NetworkWrapper(network);
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
  row: RowFunction;
  columnClasses: string[];
};

const NoDataEmptyMsg = () => <EmptyBox label="Network Interfaces" />;

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
      NoDataEmptyMsg={NoDataEmptyMsg}
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

export const VMNics: React.FC<VMLikeEntityTabProps> = ({ obj: vmLikeEntity }) => {
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
              {ADD_NETWORK_INTERFACE}
            </Button>
          </div>
        </div>
      )}
      <div className="co-m-pane__body">
        <VMNicsTable
          data={getNicsData(vmLikeEntity)}
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
