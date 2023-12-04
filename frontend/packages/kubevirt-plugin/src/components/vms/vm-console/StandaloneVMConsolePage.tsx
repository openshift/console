import * as React from 'react';
import { useParams, useLocation } from 'react-router-dom-v5-compat';
import { LoadingBox } from '@console/internal/components/utils';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { PersistentVolumeClaimModel, PodModel } from '@console/internal/models';
import { K8sResourceKind, PersistentVolumeClaimKind, PodKind } from '@console/internal/module/k8s';
import { ConsoleType } from '../../../constants/vm/console-type';
import { useEventListener } from '../../../hooks/use-event-listener';
import { useRenderVNCConsole } from '../../../hooks/use-render-vnc-console';
import {
  DataVolumeModel,
  VirtualMachineImportModel,
  VirtualMachineInstanceMigrationModel,
  VirtualMachineInstanceModel,
  VirtualMachineModel,
} from '../../../models';
import { kubevirtReferenceForModel } from '../../../models/kubevirtReferenceForModel';
import { getVMStatus } from '../../../statuses/vm/vm-status';
import { V1alpha1DataVolume } from '../../../types/api';
import { VMIKind, VMKind } from '../../../types/vm';
import { VMImportKind } from '../../../types/vm-import/ovirt/vm-import';
import VMConsoles from './VMConsoles';

const StandaloneVMConsolePage: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const type = ConsoleType.fromString(params.get('type'));
  const { name, ns: namespace } = useParams();

  const [vm, vmLoaded] = useK8sWatchResource<VMKind>({
    kind: kubevirtReferenceForModel(VirtualMachineModel),
    name,
    namespace,
    isList: false,
  });

  const [vmi, vmiLoaded] = useK8sWatchResource<VMIKind>({
    kind: kubevirtReferenceForModel(VirtualMachineInstanceModel),
    name,
    namespace,
    isList: false,
  });

  const [pods] = useK8sWatchResource<PodKind[]>({
    kind: PodModel.kind,
    namespace,
    isList: true,
  });

  const [migrations] = useK8sWatchResource<K8sResourceKind[]>({
    kind: kubevirtReferenceForModel(VirtualMachineInstanceMigrationModel),
    namespace,
    isList: true,
  });

  const [vmImports] = useK8sWatchResource<VMImportKind[]>({
    kind: kubevirtReferenceForModel(VirtualMachineImportModel),
    namespace,
    isList: true,
  });
  const [pvcs] = useK8sWatchResource<PersistentVolumeClaimKind[]>({
    kind: PersistentVolumeClaimModel.kind,
    namespace,
    isList: true,
  });
  const [dataVolumes] = useK8sWatchResource<V1alpha1DataVolume[]>({
    kind: kubevirtReferenceForModel(DataVolumeModel),
    namespace,
    isList: true,
  });
  const vmName = vm?.metadata?.name || vmi?.metadata?.name;
  useEventListener(window, 'beforeunload', () =>
    localStorage.removeItem(`isFullScreenVNC-${vmName}`),
  );
  const renderVNCConsole = useRenderVNCConsole({
    vmName,
    shouldBeFullScreen: true,
    initValue: true,
  });

  const vmStatusBundle = getVMStatus({
    vm,
    vmi,
    pods,
    migrations,
    pvcs,
    dataVolumes,
    vmImports,
  });

  return (
    <div className="co-m-pane__body">
      {vmLoaded && vmiLoaded ? (
        <VMConsoles
          vm={vm}
          vmi={vmi}
          vmStatusBundle={vmStatusBundle}
          type={type}
          renderVNCConsole={renderVNCConsole}
          showOpenInNewWindow={false}
        />
      ) : (
        <LoadingBox />
      )}
    </div>
  );
};

export default StandaloneVMConsolePage;
