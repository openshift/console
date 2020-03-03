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
import { asVM, getVMLikeModel } from '../../../selectors/vm';
import { VMLikeEntityKind } from '../../../types/vmLike';
import { DiskWrapper } from '../../../k8s/wrapper/vm/disk-wrapper';
import { VolumeWrapper } from '../../../k8s/wrapper/vm/volume-wrapper';
import { DataVolumeWrapper } from '../../../k8s/wrapper/vm/data-volume-wrapper';
import { getUpdateDiskPatches } from '../../../k8s/patches/vm/vm-disk-patches';
import { CombinedDiskFactory } from '../../../k8s/wrapper/vm/combined-disk';
import { DiskModal } from './disk-modal';
import { TemplateValidations } from '../../../utils/validations/template/template-validations';

const DiskModalFirehoseComponent: React.FC<DiskModalFirehoseComponentProps> = (props) => {
  const { disk, volume, dataVolume, vmLikeEntity, vmLikeEntityLoading, ...restProps } = props;

  const vmLikeFinal = getLoadedData(vmLikeEntityLoading, vmLikeEntity); // default old snapshot before loading a new one
  const vm = asVM(vmLikeFinal);

  const diskWrapper = disk ? DiskWrapper.initialize(disk) : DiskWrapper.EMPTY;
  const volumeWrapper = volume ? VolumeWrapper.initialize(volume) : VolumeWrapper.EMPTY;
  const dataVolumeWrapper = dataVolume
    ? DataVolumeWrapper.initialize(dataVolume)
    : DataVolumeWrapper.EMPTY;

  const combinedDiskFactory = CombinedDiskFactory.initializeFromVMLikeEntity(vmLikeFinal);

  const onSubmit = async (resultDisk, resultVolume, resultDataVolume) =>
    k8sPatch(
      getVMLikeModel(vmLikeEntity),
      vmLikeEntity,
      await getUpdateDiskPatches(vmLikeEntity, {
        disk: DiskWrapper.mergeWrappers(diskWrapper, resultDisk).asResource(),
        volume: VolumeWrapper.mergeWrappers(volumeWrapper, resultVolume).asResource(),
        dataVolume:
          resultDataVolume &&
          DataVolumeWrapper.mergeWrappers(dataVolumeWrapper, resultDataVolume).asResource(),
        oldDiskName: diskWrapper.getName(),
        oldVolumeName: volumeWrapper.getName(),
        oldDataVolumeName: dataVolumeWrapper.getName(),
      }),
    );

  return (
    <DiskModal
      {...restProps}
      usedDiskNames={combinedDiskFactory.getUsedDiskNames(diskWrapper.getName())}
      usedPVCNames={combinedDiskFactory.getUsedDataVolumeNames(dataVolumeWrapper.getName())}
      vmName={getName(vm)}
      vmNamespace={getNamespace(vm)}
      disk={diskWrapper}
      volume={volumeWrapper}
      dataVolume={dataVolumeWrapper}
      onSubmit={onSubmit}
    />
  );
};

type DiskModalFirehoseComponentProps = ModalComponentProps & {
  disk?: any;
  volume?: any;
  dataVolume?: any;
  isEditing?: boolean;
  namespace: string;
  onNamespaceChanged: (namespace: string) => void;
  storageClasses?: FirehoseResult<VMLikeEntityKind[]>;
  persistentVolumeClaims?: FirehoseResult<VMLikeEntityKind[]>;
  vmLikeEntityLoading?: FirehoseResult<VMLikeEntityKind>;
  vmLikeEntity: VMLikeEntityKind;
  templateValidations?: TemplateValidations;
};

const DiskModalFirehose: React.FC<DiskModalFirehoseProps> = (props) => {
  const { vmLikeEntity, useProjects, ...restProps } = props;

  const vmName = getName(vmLikeEntity);
  const vmNamespace = getNamespace(vmLikeEntity);

  const [namespace, setNamespace] = React.useState<string>(vmNamespace);

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
};

const diskModalStateToProps = ({ k8s }) => {
  const useProjects = k8s.hasIn(['RESOURCES', 'models', ProjectModel.kind]);
  return {
    useProjects,
  };
};

const DiskModalConnected = connect(diskModalStateToProps)(DiskModalFirehose);

export const diskModalEnhanced = createModalLauncher(DiskModalConnected);
