import * as React from 'react';
import { getNamespace } from '@console/shared';
import { Firehose } from '@console/internal/components/utils';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { PersistentVolumeClaimModel, StorageClassModel } from '@console/internal/models';
import { VMLikeEntityKind } from '../../../types';
import { asVM } from '../../../selectors/vm';
import { V1alpha1DataVolume } from '../../../types/vm/disk/V1alpha1DataVolume';
import { CDRomModal } from './cdrom-modal';

const CDRomModalFirehose: React.FC<CDRomModalFirehoseProps> = (props) => {
  const { vmLikeEntity } = props;

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
  ];

  return (
    <Firehose resources={resources}>
      <CDRomModal {...props} />
    </Firehose>
  );
};

type CDRomModalFirehoseProps = ModalComponentProps & {
  vmLikeEntity: VMLikeEntityKind;
  dataVolume?: V1alpha1DataVolume;
};

export const VMCDRomModal = createModalLauncher(CDRomModalFirehose);
