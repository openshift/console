import * as React from 'react';
import { Button } from 'patternfly-react';
import { Table } from '@console/internal/components/factory';
import { sortable } from '@patternfly/react-table';
import { createBasicLookup } from '@console/shared';
import { VMLikeEntityKind } from '../../types';
import { getInterfaces, getNetworks, asVM } from '../../selectors/vm';
import { dimensifyHeader } from '../../utils/table';
import { VMLikeEntityTabProps } from '../vms/types';
import { NetworkInterfaceWrapper } from '../../k8s/wrapper/vm/network-interface-wrapper';
import { nicModalEnhanced } from '../modals/nic-modal/nic-modal-enhanced';
import { getSimpleName } from '../../selectors/utils';
import { NetworkWrapper } from '../../k8s/wrapper/vm/network-wrapper';
import { NicRow } from './nic-row';
import { NetworkBundle } from './types';
import { nicTableColumnClasses } from './utils';

const getNicsData = (vmLikeEntity: VMLikeEntityKind): NetworkBundle[] => {
  const vm = asVM(vmLikeEntity);
  const networkLookup = createBasicLookup(getNetworks(vm), getSimpleName);

  return getInterfaces(vm).map((nic) => {
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

export const VMNics: React.FC<VMLikeEntityTabProps> = ({ obj: vmLikeEntity }) => (
  <div className="co-m-list">
    <div className="co-m-pane__filter-bar">
      <div className="co-m-pane__filter-bar-group">
        <Button
          bsStyle="primary"
          id="create-nic-btn"
          onClick={() =>
            nicModalEnhanced({
              vmLikeEntity,
            })
          }
        >
          Create Network Interface
        </Button>
      </div>
    </div>
    <div className="co-m-pane__body">
      <Table
        aria-label="VM Nics List"
        data={getNicsData(vmLikeEntity)}
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
            nicTableColumnClasses,
          )
        }
        Row={NicRow}
        customData={{
          vmLikeEntity,
        }}
        virtualize
        loaded
      />
    </div>
  </div>
);
