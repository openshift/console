import * as React from 'react';
import { Button } from 'patternfly-react';
import { Alert, AlertActionCloseButton } from '@patternfly/react-core';
import * as _ from 'lodash';
import { Table } from '@console/internal/components/factory';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { sortable } from '@patternfly/react-table';
import { createBasicLookup } from '@console/shared';
import { VMLikeEntityKind } from '../../types';
import { asVM } from '../../selectors/selectors';
import { getInterfaces, getNetworks, getVmPreferableNicBus } from '../../selectors/vm';
import { dimensifyHeader } from '../../utils/table';
import { VMLikeEntityTabProps } from '../vms/types';
import { NicRow } from './nic-row';
import { NetworkBundle, NetworkRowType, VMNicRowProps } from './types';
import { CreateNicRowConnected } from './create-nic-row';
import { getInterfaceBinding, getNetworkName, nicTableColumnClasses } from './utils';

export const VMNicRow: React.FC<VMNicRowProps> = (props) => {
  switch (props.obj.networkType) {
    case NetworkRowType.NETWORK_TYPE_VM:
      return <NicRow {...props} key={NetworkRowType.NETWORK_TYPE_VM} />;
    case NetworkRowType.NETWORK_TYPE_CREATE:
      return <CreateNicRowConnected {...props} key={NetworkRowType.NETWORK_TYPE_CREATE} />;
    default:
      return null;
  }
};

const getNicsData = (
  vmLikeEntity: VMLikeEntityKind,
  addNewNic: boolean,
  rerenderFlag: boolean,
): NetworkBundle[] => {
  const vm = asVM(vmLikeEntity);
  const networkLookup = createBasicLookup(getNetworks(vm), (network) => _.get(network, 'name'));

  const nicsWithType = getInterfaces(vm).map((nic) => ({
    ...nic, // for sorting
    networkType: NetworkRowType.NETWORK_TYPE_VM,
    networkName: getNetworkName(networkLookup[nic.name]),
    binding: getInterfaceBinding(nic),
    nic,
  }));

  return addNewNic
    ? [{ networkType: NetworkRowType.NETWORK_TYPE_CREATE, rerenderFlag }, ...nicsWithType]
    : nicsWithType;
};

export const VMNics: React.FC<VMLikeEntityTabProps> = ({ obj: vmLikeEntity }) => {
  const [isCreating, setIsCreating] = useSafetyFirst(false);
  const [createError, setCreateError] = useSafetyFirst(null);
  const [rerenderFlag, setRerenderFlag] = useSafetyFirst(false); // TODO: HACK: fire changes in Virtualize Table for CreateNicRow. Remove after deprecating CreateNicRow

  const vm = asVM(vmLikeEntity);
  const preferableNicBus = getVmPreferableNicBus(vm);

  return (
    <div className="co-m-list">
      <div className="co-m-pane__filter-bar">
        <div className="co-m-pane__filter-bar-group">
          <Button
            bsStyle="primary"
            id="create-nic-btn"
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
          >
            Create Nic
          </Button>
        </div>
      </div>
      <div className="co-m-pane__body">
        {createError && (
          <Alert
            variant="danger"
            title={createError}
            className="kubevirt-vm-create-device-error"
            action={<AlertActionCloseButton onClose={() => setCreateError(null)} />}
          />
        )}
        <Table
          aria-label="VM Nics List"
          data={getNicsData(vmLikeEntity, isCreating, rerenderFlag)}
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
                  title: 'Binding Method',
                  sortField: 'binding',
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
              nicTableColumnClasses,
            )
          }
          Row={VMNicRow}
          customData={{
            vmLikeEntity,
            vm,
            preferableNicBus,
            interfaceLookup: createBasicLookup(getInterfaces(vm), (intface) =>
              _.get(intface, 'name'),
            ),
            onCreateRowDismiss: () => {
              setIsCreating(false);
            },
            onCreateRowError: (error) => {
              setIsCreating(false);
              setCreateError(error);
            },
            forceRerender: () => setRerenderFlag(!rerenderFlag),
          }}
          virtualize
          loaded
        />
      </div>
    </div>
  );
};
