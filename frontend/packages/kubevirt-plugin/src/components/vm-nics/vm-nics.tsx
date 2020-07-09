import * as React from 'react';
import { Table, RowFunction } from '@console/internal/components/factory';
import { sortable } from '@patternfly/react-table';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { createBasicLookup, dimensifyHeader } from '@console/shared';
import { EmptyBox, Firehose } from '@console/internal/components/utils';
import { Button, ButtonVariant } from '@patternfly/react-core';
import { VMGenericLikeEntityKind } from '../../types/vmLike';
import { isVMI, isVM } from '../../selectors/check-type';
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
import { isVMRunningOrExpectedRunning } from '../../selectors/vm';
import { FirehoseResult } from '../../../../../public/components/utils/types';
import { VMIKind } from '../../types/vm';
import { VirtualMachineInstanceModel } from '../../models';
import { getNamespace } from '../../../../console-shared/src/selectors/common';
import { getLoadedData } from '../../utils/index';
import { isNicsChanged, PendingChangesAlert } from '../../selectors/vm-like/nextRunChanges';
import { VMWrapper } from '../../k8s/wrapper/vm/vm-wrapper';
import { VMIWrapper } from '../../k8s/wrapper/vm/vmi-wrapper';
import { NIC_TAB_RESTART_IS_REQUIRED } from '../../strings/vm/status';

const getNicsData = (vmLikeEntity: VMGenericLikeEntityKind): NetworkBundle[] => {
  const vmiLikeWrapper = asVMILikeWrapper(vmLikeEntity);

  const networks = vmiLikeWrapper?.getNetworks() || [];
  const interfaces = vmiLikeWrapper?.getNetworkInterfaces() || [];

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

type VMNicsProps = {
  obj: VMGenericLikeEntityKind;
  vmis?: FirehoseResult<VMIKind[]>;
};

export const VMNics: React.FC<VMNicsProps> = ({ obj: vmLikeEntity, vmis }) => {
  const [isLocked, setIsLocked] = useSafetyFirst(false);
  const withProgress = wrapWithProgress(setIsLocked);

  const loadedVMIs = vmis && getLoadedData(vmis);
  const vmi = loadedVMIs && loadedVMIs.length > 0 && loadedVMIs[0];
  const isVMRunning = isVM(vmLikeEntity) && isVMRunningOrExpectedRunning(vmLikeEntity);

  return (
    <div className="co-m-list">
      {isVMRunning && isNicsChanged(new VMWrapper(vmLikeEntity), new VMIWrapper(vmi)) && (
        <PendingChangesAlert warningMsg={NIC_TAB_RESTART_IS_REQUIRED} />
      )}
      {!isVMI(vmLikeEntity) && (
        <div className="co-m-pane__filter-bar">
          <div className="co-m-pane__filter-bar-group">
            <Button
              variant={ButtonVariant.primary}
              id="add-nic"
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

export const VMNicsFirehose: React.FC<VMLikeEntityTabProps> = ({ obj: vmLikeEntity }) => {
  const resources = [
    {
      kind: VirtualMachineInstanceModel.kind,
      namespace: getNamespace(vmLikeEntity),
      prop: 'vmis',
      isList: true,
    },
  ];

  return (
    <Firehose resources={resources}>
      <VMNics obj={vmLikeEntity} />
    </Firehose>
  );
};
