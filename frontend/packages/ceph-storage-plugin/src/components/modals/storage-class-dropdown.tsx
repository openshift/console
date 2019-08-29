import * as React from 'react';
import * as _ from 'lodash';
import { Firehose } from '@console/internal/components/utils';
import { StorageClassDropdownInner } from '@console/internal/components/utils/storage-class-dropdown';
import { K8sResourceKind } from '@console/internal/module/k8s';

const cephStorageProvisioners = ['ceph.rook.io/block', 'cephfs.csi.ceph.com', 'rbd.csi.ceph.com'];

export const OCSStorageClassDropdown: React.FC<OCSStorageClassDropdownProps> = (props) => (
  <Firehose resources={[{ kind: 'StorageClass', prop: 'StorageClass', isList: true }]}>
    <StorageClassDropdown {...props} />
  </Firehose>
);

const StorageClassDropdown = (props: any) => {
  const scConfig = _.cloneDeep(props);
  /* 'S' of Storage should be Capital as its defined key in resourses object */
  const scLoaded = _.get(scConfig.resources.StorageClass, 'loaded');
  const scData = _.get(scConfig.resources.StorageClass, 'data', []) as K8sResourceKind[];

  const filteredSCData = scData.filter((sc: K8sResourceKind) => {
    return cephStorageProvisioners.every(
      (provisioner: string) => !_.get(sc, 'provisioner').includes(provisioner),
    );
  });

  if (scLoaded) {
    scConfig.resources.StorageClass.data = filteredSCData;
  }

  return <StorageClassDropdownInner {...scConfig} />;
};

type OCSStorageClassDropdownProps = {
  id?: string;
  loaded?: boolean;
  resources?: any;
  name: string;
  onChange: (object) => void;
  describedBy?: string;
  defaultClass: string;
  required?: boolean;
};
