import * as React from 'react';
import { PodKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getUID } from '@console/shared';
import { VM_STATUS_IMPORTING, VM_STATUS_IMPORT_ERROR } from '../../statuses/vm/constants';
import { VMKind, VMIKind } from '../../types';
import { getVMStatus } from '../../statuses/vm/vm';
import { getVMImporterPods } from '../../selectors/pod/selectors';
import { VMStatus } from './vm-status';
import { VMImportKind } from '../../types/vm-import/ovirt/vm-import';

export const VMStatuses: React.FC<VMStatusesProps> = (props) => {
  const { vm, vmi, pods, migrations, vmImports } = props;
  const statusDetail = getVMStatus({ vm, vmi, pods, migrations, vmImports });
  const importerPods = getVMImporterPods(vm, pods);

  switch (statusDetail.status) {
    case VM_STATUS_IMPORTING:
    case VM_STATUS_IMPORT_ERROR:
      return (
        <>
          {importerPods.map((pod) => (
            <div key={getUID(pod)}>
              <VMStatus {...props} pods={[pod]} verbose />
            </div>
          ))}
        </>
      );
    default:
      return <VMStatus {...props} />;
  }
};

type VMStatusesProps = {
  vm: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  vmImports?: VMImportKind[];
};
