import * as React from 'react';
import { Alert, Button } from 'patternfly-react';

import { Table } from '@console/internal/components/factory';
import { PersistentVolumeClaimModel } from '@console/internal/models';
import { Firehose, FirehoseResult, Kebab } from '@console/internal/components/utils';
import { getResource } from 'kubevirt-web-ui-components';
import { getNamespace } from '@console/shared';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { DataVolumeModel } from '../../models';

import { VMLikeEntityKind } from '../../types';
import { asVm } from '../../selectors/selectors';
import { getDataVolumeTemplates, getDisks, getVolumes } from '../../selectors/vm';
import { createBasicLookup, createLookup } from '../../utils';
import { DiskRow } from './disk-row';
import { StorageTypeEnum, VMDiskRowProps } from './types';
import { CreateDiskRowFirehose } from './create-disk-row';

export const VMDiskRow: React.FC<VMDiskRowProps> = (props) => {
  switch (props.obj.storageType) {
    case StorageTypeEnum.STORAGE_TYPE_VM:
      return <DiskRow {...props} key={StorageTypeEnum.STORAGE_TYPE_VM} />;
    case StorageTypeEnum.STORAGE_TYPE_CREATE:
      return <CreateDiskRowFirehose {...props} key={StorageTypeEnum.STORAGE_TYPE_CREATE} />;
    default:
      return null;
  }
};

const getStoragesData = (vmLikeEntity: VMLikeEntityKind, addNewDisk: boolean): StorageBundle[] => {
  const vm = asVm(vmLikeEntity);

  const disksWithType = getDisks(vm).map((disk) => ({
    name: disk.name,
    storageType: StorageTypeEnum.STORAGE_TYPE_VM,
    disk,
  }));

  return addNewDisk
    ? [{ storageType: StorageTypeEnum.STORAGE_TYPE_CREATE }, ...disksWithType]
    : disksWithType;
};

type StorageBundle = {
  name: string;
  storageType: StorageTypeEnum;
  disk: any;
};

export const VMDisks: React.FC<VMDisksProps> = ({ vmLikeEntity, pvcs, datavolumes }) => {
  const [isCreating, setIsCreating] = useSafetyFirst(false);
  const [createError, setCreateError] = useSafetyFirst(null);

  const vm = asVm(vmLikeEntity);

  return (
    <div className="co-m-list">
      <div className="co-m-pane__filter-bar">
        <div className="co-m-pane__filter-bar-group">
          <Button
            bsStyle="primary"
            id="create-disk-btn"
            onClick={() => setIsCreating(true)}
            disabled={isCreating}
          >
            Create Disk
          </Button>
        </div>
      </div>
      <div className="co-m-pane__body">
        {createError && <Alert onDismiss={() => setCreateError(null)}>{createError}</Alert>}
        <Table
          aria-label="VM Disks List"
          data={getStoragesData(vmLikeEntity, isCreating)}
          Header={() => [
            {
              title: 'Name',
            },
            {
              title: 'Size',
            },
            {
              title: 'Interface',
            },
            {
              title: 'Storage Class',
            },
            {
              title: '',
              props: { className: Kebab.columnClass },
            },
          ]}
          Row={VMDiskRow}
          customData={{
            vmLikeEntity,
            vm,
            pvcs,
            pvcLookup: createLookup(pvcs),
            datavolumes,
            datavolumeLookup: createLookup(datavolumes),
            volumeLookup: createBasicLookup(getVolumes(vm), 'name'),
            datavolumeTemplatesLookup: createBasicLookup(
              getDataVolumeTemplates(vm),
              'metadata.name',
            ),
            onCreateRowDismiss: () => {
              setIsCreating(false);
            },
            onCreateRowError: (error) => {
              setIsCreating(false);
              setCreateError(error);
            },
          }}
          loaded
        />
      </div>
    </div>
  );
};

interface VMDisksProps {
  vmLikeEntity?: VMLikeEntityKind;
  pvcs?: FirehoseResult<K8sResourceKind[]>;
  datavolumes?: FirehoseResult<K8sResourceKind[]>;
}

export const VMDisksFirehose: React.FC<VMDisksFirehoseProps> = ({ obj: vmLikeEntity }) => {
  const namespace = getNamespace(vmLikeEntity);

  const resources = [
    getResource(PersistentVolumeClaimModel, {
      namespace,
      prop: 'pvcs',
    }),
    getResource(DataVolumeModel, {
      namespace,
      prop: 'datavolumes',
    }),
  ];

  return (
    <Firehose resources={resources}>
      <VMDisks vmLikeEntity={vmLikeEntity} />
    </Firehose>
  );
};

interface VMDisksFirehoseProps {
  obj?: VMLikeEntityKind;
}
