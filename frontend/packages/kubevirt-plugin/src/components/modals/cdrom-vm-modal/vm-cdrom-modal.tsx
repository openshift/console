import * as React from 'react';
import { getNamespace } from '@console/shared';
import { Firehose } from '@console/internal/components/utils';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { PersistentVolumeClaimModel, StorageClassModel } from '@console/internal/models';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { asVM } from '../../../selectors/vm';
import { V1alpha1DataVolume } from '../../../types/vm/disk/V1alpha1DataVolume';
import { CDRomModal } from './cdrom-modal';
import { WINTOOLS_CONTAINER_NAMES } from './constants';
import { VirtualMachineInstanceModel } from '../../../models';

const CDRomModalFirehose: React.FC<CDRomModalFirehoseProps> = (props) => {
  const { vmLikeEntity } = props;

  const winToolsContainer =
    WINTOOLS_CONTAINER_NAMES[window.SERVER_FLAGS.branding] || WINTOOLS_CONTAINER_NAMES.okd;

  const resources = [
    {
      kind: StorageClassModel.kind,
      isList: true,
      prop: 'storageClasses',
    },
    {
      kind: PersistentVolumeClaimModel.kind,
      isList: true,
      namespace: getNamespace(asVM(vmLikeEntity)),
      prop: 'persistentVolumeClaims',
    },
    {
      kind: VirtualMachineInstanceModel.kind,
      namespace: getNamespace(asVM(vmLikeEntity)),
      prop: 'vmis',
      isList: true,
    },
  ];

  return (
    <Firehose resources={resources}>
      <CDRomModal winToolsContainer={winToolsContainer} {...props} />
    </Firehose>
  );
};

type CDRomModalFirehoseProps = ModalComponentProps & {
  vmLikeEntity: VMLikeEntityKind;
  dataVolume?: V1alpha1DataVolume;
};

export const VMCDRomModal = createModalLauncher(CDRomModalFirehose);
