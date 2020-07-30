import * as React from 'react';
import { connect } from 'react-redux';
import { Firehose, FirehoseResult } from '@console/internal/components/utils';
import { createModalLauncher, ModalComponentProps } from '@console/internal/components/factory';
import { k8sPatch } from '@console/internal/module/k8s';
import { getName, getNamespace } from '@console/shared/src';
import {
  NamespaceModel,
  PersistentVolumeClaimModel,
  ProjectModel,
  StorageClassModel,
} from '@console/internal/models';
import { getLoadedData } from '../../../utils';
import { getVMLikeModel } from '../../../selectors/vm';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { DiskWrapper } from '../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../k8s/wrapper/vm/volume-wrapper';
import { DataVolumeWrapper } from '../../../k8s/wrapper/vm/data-volume-wrapper';
import { getUpdateDiskPatches } from '../../../k8s/patches/vm/vm-disk-patches';
import { CombinedDiskFactory } from '../../../k8s/wrapper/vm/combined-disk';
import { DiskModal } from './disk-modal';
import { TemplateValidations } from '../../../utils/validations/template/template-validations';
import { V1Disk } from '../../../types/vm/disk/V1Disk';
import { V1Volume } from '../../../types/vm/disk/V1Volume';
import { V1alpha1DataVolume } from '../../../types/vm/disk/V1alpha1DataVolume';
import { useStorageClassConfigMapWrapped } from '../../../hooks/storage-class-config-map';
import { isTemplate } from '../../../selectors/check-type';

const DiskModalFirehoseComponent: React.FC<DiskModalFirehoseComponentProps> = (props) => {
  const {
    disk,
    volume,
    dataVolume,
    vmLikeEntity,
    vmLikeEntityLoading,
    isVMRunning,
    ...restProps
  } = props;

  const vmLikeFinal = getLoadedData(vmLikeEntityLoading, vmLikeEntity); // default old snapshot before loading a new one

  const diskWrapper = new DiskWrapper(disk);
  const volumeWrapper = new VolumeWrapper(volume);
  const dataVolumeWrapper = new DataVolumeWrapper(dataVolume);

  const combinedDiskFactory = CombinedDiskFactory.initializeFromVMLikeEntity(vmLikeFinal);

  const onSubmit = async (resultDisk, resultVolume, resultDataVolume) =>
    k8sPatch(
      getVMLikeModel(vmLikeEntity),
      vmLikeEntity,
      getUpdateDiskPatches(vmLikeEntity, {
        disk: new DiskWrapper(diskWrapper, true).mergeWith(resultDisk).asResource(),
        volume: new VolumeWrapper(volumeWrapper, true).mergeWith(resultVolume).asResource(),
        dataVolume:
          resultDataVolume &&
          new DataVolumeWrapper(dataVolume, true).mergeWith(resultDataVolume).asResource(),
        oldDiskName: diskWrapper.getName(),
        oldVolumeName: volumeWrapper.getName(),
        oldDataVolumeName: dataVolumeWrapper.getName(),
      }),
    );

  const storageClassConfigMap = useStorageClassConfigMapWrapped();

  return (
    <DiskModal
      {...restProps}
      storageClassConfigMap={storageClassConfigMap}
      usedDiskNames={combinedDiskFactory.getUsedDiskNames(diskWrapper.getName())}
      usedPVCNames={combinedDiskFactory.getUsedDataVolumeNames(dataVolumeWrapper.getName())}
      vmName={getName(vmLikeFinal)}
      vmNamespace={getNamespace(vmLikeFinal)}
      disk={new DiskWrapper(diskWrapper, true)}
      volume={new VolumeWrapper(volumeWrapper, true)}
      dataVolume={new DataVolumeWrapper(dataVolumeWrapper, true)}
      onSubmit={onSubmit}
      isVMRunning={isVMRunning}
    />
  );
};

type DiskModalFirehoseComponentProps = ModalComponentProps & {
  disk?: V1Disk;
  volume?: V1Volume;
  dataVolume?: V1alpha1DataVolume;
  isEditing?: boolean;
  namespace: string;
  onNamespaceChanged: (namespace: string) => void;
  storageClasses?: FirehoseResult<VMLikeEntityKind[]>;
  persistentVolumeClaims?: FirehoseResult<VMLikeEntityKind[]>;
  vmLikeEntityLoading?: FirehoseResult<VMLikeEntityKind>;
  vmLikeEntity: VMLikeEntityKind;
  templateValidations?: TemplateValidations;
  isVMRunning?: boolean;
};

const DiskModalFirehose: React.FC<DiskModalFirehoseProps> = (props) => {
  const { vmLikeEntity, useProjects, ...restProps } = props;

  const vmName = getName(vmLikeEntity);
  const vmNamespace = getNamespace(vmLikeEntity);

  const [namespace, setNamespace] = React.useState<string>(
    new DataVolumeWrapper(props.dataVolume).getPesistentVolumeClaimNamespace() || vmNamespace,
  );

  const resources = [
    {
      kind: (useProjects ? ProjectModel : NamespaceModel).kind,
      isList: true,
      prop: 'namespaces',
    },
    {
      kind: getVMLikeModel(vmLikeEntity).kind,
      name: vmName,
      namespace: vmNamespace,
      prop: 'vmLikeEntityLoading',
    },
    {
      kind: StorageClassModel.kind,
      isList: true,
      prop: 'storageClasses',
    },
    {
      kind: PersistentVolumeClaimModel.kind,
      isList: true,
      namespace,
      prop: 'persistentVolumeClaims',
    },
  ];

  return (
    <Firehose resources={resources}>
      <DiskModalFirehoseComponent
        vmLikeEntity={vmLikeEntity}
        namespace={namespace}
        onNamespaceChanged={(n) => setNamespace(n)}
        isTemplate={isTemplate(vmLikeEntity)}
        {...restProps}
      />
    </Firehose>
  );
};

type DiskModalFirehoseProps = ModalComponentProps & {
  vmLikeEntity: VMLikeEntityKind;
  disk?: any;
  volume?: any;
  dataVolume?: any;
  isEditing?: boolean;
  useProjects: boolean;
  templateValidations?: TemplateValidations;
  isTemplate?: boolean;
  isVMRunning?: boolean;
};

const diskModalStateToProps = ({ k8s }) => {
  const useProjects = k8s.hasIn(['RESOURCES', 'models', ProjectModel.kind]);
  return {
    useProjects,
  };
};

const DiskModalConnected = connect(diskModalStateToProps)(DiskModalFirehose);

export const diskModalEnhanced = createModalLauncher(DiskModalConnected);
