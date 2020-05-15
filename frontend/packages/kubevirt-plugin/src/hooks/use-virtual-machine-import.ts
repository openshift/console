import * as React from 'react';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import { getCreationTimestamp, getName, getNamespace } from '@console/shared/src/selectors/common';
import { VMKind } from '../types/vm';
import { VMImportKind } from '../types/vm-import/ovirt/vm-import';
import { VirtualMachineImportModel } from '../models';
import { VMImportWrappper } from '../k8s/wrapper/vm-import/vm-import-wrapper';
import { VMWrapper } from '../k8s/wrapper/vm/vm-wrapper';

export const useVirtualMachineImport = (vm: VMKind) => {
  const resourceWatch = React.useMemo(() => {
    if (!vm) {
      return null;
    }

    const vmImportOwnerReference = new VMWrapper(vm).getVMImportOwnerReference();

    if (vmImportOwnerReference) {
      return {
        name: vmImportOwnerReference.name,
        kind: VirtualMachineImportModel.kind,
        namespace: getNamespace(vm),
        isList: false,
      };
    }
    return {
      kind: VirtualMachineImportModel.kind,
      namespace: getNamespace(vm),
      isList: true,
    };
  }, [vm]);
  const resourceWatchID = (resourceWatch?.name || '') + +':' + resourceWatch?.namespace; // should be the unique identifier of a query
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const resourceWatchWithVMChangesMemoized = React.useMemo(() => resourceWatch, [resourceWatchID]);

  const [data, loaded, loadError] = useK8sWatchResource<VMImportKind | VMImportKind[]>(
    resourceWatchWithVMChangesMemoized,
  );

  if (!resourceWatch) {
    return [null, true] as [VMImportKind, boolean];
  }

  let vmImport;
  if (resourceWatch.isList) {
    // eslint-disable-next-line prefer-destructuring
    vmImport = ((data as VMImportKind[]) || [])
      .filter((vi) => new VMImportWrappper(vi).getResolvedVMTargetName() === getName(vm))
      .sort((a, b) => (getCreationTimestamp(a) > getCreationTimestamp(b) ? -1 : 1))[0];
  } else {
    vmImport = loadError ? null : data;
  }

  return [vmImport, loaded || !!loadError] as [VMImportKind, boolean];
};
