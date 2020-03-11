import * as React from 'react';
import * as _ from 'lodash';
import { Firehose, FieldLevelHelp } from '@console/internal/components/utils';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { StorageClassDropdownInner } from '@console/internal/components/utils/storage-class-dropdown';
import { cephStorageProvisioners, getName } from '@console/shared';
import { storageClassTooltip } from '../../constants/ocs-install';
import './storage-class-dropdown.scss';

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

export const OCSStorageClassDropdown: React.FC<OCSStorageClassDropdownProps> = (props) => {
  const { onChange, defaultClass } = props;

  const handleStorageClass = (sc: K8sResourceKind) => {
    const name = getName(sc);
    onChange(name);
  };
  return (
    <>
      <label className="control-label" htmlFor="storageClass">
        Storage Class
        <FieldLevelHelp>{storageClassTooltip}</FieldLevelHelp>
      </label>
      <Firehose resources={[{ kind: 'StorageClass', prop: 'StorageClass', isList: true }]}>
        <StorageClassDropdown
          onChange={handleStorageClass}
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
  onChange: React.Dispatch<React.SetStateAction<string>>;
  defaultClass?: string;
};
