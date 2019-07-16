import * as React from 'react';

import {
  Text,
  Integer,
  Dropdown,
  CancelAcceptButtons,
  VALIDATION_INFO_TYPE,
  getResource,
} from 'kubevirt-web-ui-components';

import { TableData, TableRow } from '@console/internal/components/factory';
import { Firehose, FirehoseResult, LoadingInline } from '@console/internal/components/utils';
import { HelpBlock, FormGroup } from 'patternfly-react';
import { StorageClassModel, TemplateModel } from '@console/internal/models';
import { getName } from '@console/shared';
import { useSafetyFirst } from '@console/internal/components/safety-first';
import { k8sPatch, K8sResourceKind } from '@console/internal/module/k8s';
import { VMDiskRowProps } from './types';
import { getVmPreferableDiskBus } from '../../selectors/vm';
import { isVm } from '../../selectors/selectors';
import { VirtualMachineModel } from '../../models';
import { getAddDiskPatches } from '../../k8s/patches/vm/vm-disk-patches';
import { VMLikeEntityKind } from '../../types';

import './_create-device-row.scss';
import { validateDiskName } from '../../utils/validations/vm';

const createDisk = ({
  vmLikeEntity,
  disk,
}: {
  vmLikeEntity: VMLikeEntityKind;
  disk: any;
}): Promise<VMLikeEntityKind> => {
  const patches = getAddDiskPatches(vmLikeEntity, disk);
  const model = isVm(vmLikeEntity) ? VirtualMachineModel : TemplateModel;

  return k8sPatch(model, vmLikeEntity, patches);
};

type StorageClassColumn = {
  storageClass: string;
  onChange: (string) => void;
  storageClasses: FirehoseResult<K8sResourceKind[]>;
  creating: boolean;
};

const StorageClassColumn: React.FC<StorageClassColumn> = ({
  storageClass,
  onChange,
  storageClasses,
  creating,
}) => {
  if (storageClasses.loaded) {
    const loadedClasses = storageClasses.data;
    const storageClassValue =
      storageClass ||
      (loadedClasses.length === 0
        ? '--- No Storage Class Available ---'
        : '--- Select Storage Class ---');
    return (
      <Dropdown
        id="disk-storage-class"
        choices={loadedClasses.map((sc) => getName(sc))}
        value={storageClassValue}
        onChange={onChange}
        disabled={loadedClasses.length === 0 || creating}
      />
    );
  }
  return <LoadingInline />;
};

type CreateDiskRowProps = VMDiskRowProps & { storageClasses?: FirehoseResult<K8sResourceKind[]> };

export const CreateDiskRow: React.FC<CreateDiskRowProps> = ({
  storageClasses,
  customData: { vm, vmLikeEntity, diskLookup, onCreateRowDismiss, onCreateRowError },
  index,
  style,
}) => {
  const [creating, setCreating] = useSafetyFirst(false);
  const [name, setName] = React.useState('');
  const [size, setSize] = React.useState('');
  const [storageClass, setStorageClass] = React.useState(null);

  const id = 'create-disk-row';

  const nameError = validateDiskName(name, diskLookup);
  const isValid = !nameError && size;

  const bus = getVmPreferableDiskBus(vm);
  return (
    <TableRow id={id} index={index} trKey={id} style={style}>
      <TableData>
        <FormGroup
          className="kubevirt-vm-create-device-row__cell--no_bottom"
          validationState={
            nameError && !nameError.isEmptyError && nameError.type !== VALIDATION_INFO_TYPE
              ? nameError.type
              : null
          }
        >
          <Text id="disk-name" disabled={creating} onChange={setName} value={name} />
          <HelpBlock className="kubevirt-vm-create-device-row__cell--help">
            {nameError && !nameError.isEmptyError && nameError.message}
          </HelpBlock>
        </FormGroup>
      </TableData>
      <TableData>
        <Integer
          id="disk-size"
          positive
          disabled={creating}
          value={size}
          className="kubevirt-vm-create-device-row__cell_field--with-addendum"
          onChange={setSize}
        />
        <span className="kubevirt-vm-create-device-row__cell_addendum">Gi</span>
      </TableData>
      <TableData id="disk-bus">{bus}</TableData>
      <TableData>
        <StorageClassColumn
          storageClass={storageClass}
          onChange={setStorageClass}
          storageClasses={storageClasses}
          creating={creating}
        />
      </TableData>
      <TableData className="kubevirt-vm-create-device-row__confirmation-buttons">
        <CancelAcceptButtons
          onCancel={onCreateRowDismiss}
          onAccept={() => {
            setCreating(true);
            createDisk({ vmLikeEntity, disk: { name, size, bus, storageClass } })
              .then(onCreateRowDismiss)
              .catch((error) => {
                onCreateRowError((error && error.message) || 'Error occured, please try again');
                setCreating(false);
              });
          }}
          disabled={!isValid}
        />
      </TableData>
    </TableRow>
  );
};

export const CreateDiskRowFirehose: React.FC<VMDiskRowProps> = (props) => {
  const resources = [
    getResource(StorageClassModel, {
      prop: 'storageClasses',
    }),
  ];

  return (
    <Firehose resources={resources}>
      <CreateDiskRow {...props} />
    </Firehose>
  );
};
