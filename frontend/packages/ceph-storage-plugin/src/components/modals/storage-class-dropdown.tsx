import * as React from 'react';
import * as _ from 'lodash';
import { Firehose, FieldLevelHelp } from '@console/internal/components/utils';
import { InfrastructureModel } from '@console/internal/models';
import { K8sResourceKind, StorageClassResourceKind, k8sGet } from '@console/internal/module/k8s';
import { StorageClassDropdownInner } from '@console/internal/components/utils/storage-class-dropdown';
import { getInfrastructurePlatform, getName } from '@console/shared';
import { infraProvisionerMap, storageClassTooltip } from '../../constants/ocs-install';
import './storage-class-dropdown.scss';

const StorageClassDropdown = (props: any) => {
  const scConfig = _.cloneDeep(props);
  const [infrastructure, setInfrastructure] = React.useState<K8sResourceKind>();
  const [infrastructureError, setInfrastructureError] = React.useState();
  /* 'S' of Storage should be Capital as its defined key in resourses object */
  const scLoaded = _.get(scConfig.resources.StorageClass, 'loaded');
  const scData = _.get(scConfig.resources.StorageClass, 'data', []) as StorageClassResourceKind[];

  React.useEffect(() => {
    const fetchInfrastructure = async () => {
      try {
        const infra = await k8sGet(InfrastructureModel, 'cluster');
        setInfrastructure(infra);
      } catch (error) {
        setInfrastructureError(error);
      }
    };
    fetchInfrastructure();
  }, []);

  const infrastructurePlatform = getInfrastructurePlatform(infrastructure);

  if (scLoaded && !infrastructureError && !!infrastructurePlatform) {
    // find infra supported provisioner
    const provisioner: string = infraProvisionerMap[_.toLower(infrastructurePlatform)];
    scConfig.resources.StorageClass.data = _.filter(scData, (sc) => sc.provisioner === provisioner);
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
