import * as React from 'react';
import * as _ from 'lodash';
import { Firehose } from '@console/internal/components/utils';
import { StorageClassResourceKind } from '@console/internal/module/k8s';
import { StorageClassDropdownInner } from '@console/internal/components/utils/storage-class-dropdown';
import './storage-class-dropdown.scss';

const cephStorageProvisioners = ['ceph.rook.io/block', 'cephfs.csi.ceph.com', 'rbd.csi.ceph.com'];

const StorageClassDropdown = (props: any) => {
  const scConfig = _.cloneDeep(props);
  /* 'S' of Storage should be Capital as its defined key in resources object */
  const scLoaded = _.get(scConfig.resources.StorageClass, 'loaded');
  const scData = _.get(scConfig.resources.StorageClass, 'data', []) as StorageClassResourceKind[];

  const filteredSCData = scData.filter((sc: StorageClassResourceKind) =>
    cephStorageProvisioners.every((provisioner: string) => !sc?.provisioner?.includes(provisioner)),
  );

  if (scLoaded) {
    scConfig.resources.StorageClass.data = filteredSCData;
  }

  return <StorageClassDropdownInner {...scConfig} />;
};

export const OCSStorageClassDropdown: React.FC<OCSStorageClassDropdownProps> = (props) => {
  const { onChange, defaultClass } = props;

  return (
    <>
      <Firehose resources={[{ kind: 'StorageClass', prop: 'StorageClass', isList: true }]}>
        <StorageClassDropdown
          onChange={onChange}
          name="storageClass"
          defaultClass={defaultClass}
          hideClassName="ceph-sc-dropdown__hide-default"
          required
        />
      </Firehose>
    </>
  );
};

type OCSStorageClassDropdownProps = {
  onChange: (sc: StorageClassResourceKind) => void;
  defaultClass?: string;
};
