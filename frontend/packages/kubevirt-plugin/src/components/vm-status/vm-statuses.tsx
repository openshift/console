import * as React from 'react';
import { PodKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getNamespace, getName } from '@console/shared';
import { VM_STATUS_IMPORTING, VM_STATUS_IMPORT_ERROR } from '../../statuses/vm/constants';
import { VMKind } from '../../types';
import { getVMStatus } from '../../statuses/vm/vm';
import { getVMImporterPods } from '../../selectors/pod/selectors';
import { VMStatus } from './vm-status';

const getId = (value) => `${getNamespace(value)}-${getName(value)}`;

export const VmStatuses: React.FC<VmStatusesProps> = (props) => {
  const { vm, pods, migrations } = props;
  const statusDetail = getVMStatus(vm, pods, migrations);
  const importerPods = getVMImporterPods(pods, vm);

  switch (statusDetail.status) {
    case VM_STATUS_IMPORTING:
    case VM_STATUS_IMPORT_ERROR:
      return (
        <>
          {importerPods.map((pod) => (
            <div key={getId(pod)}>
              <VMStatus {...props} pods={[pod]} verbose />
            </div>
          ))}
        </>
      );
    default:
      return <VMStatus {...props} />;
  }
};

type VmStatusesProps = {
  vm: VMKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
};
