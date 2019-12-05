import * as React from 'react';
import * as _ from 'lodash';
import { Firehose } from '@console/internal/components/utils';
import { InfrastructureModel } from '@console/internal/models';
import { K8sResourceKind, StorageClassResourceKind, k8sGet } from '@console/internal/module/k8s';
import { StorageClassDropdownInner } from '@console/internal/components/utils/storage-class-dropdown';
import { getInfrastructurePlatform } from '@console/shared';
import { infraProvisionerMap } from '../../constants/ocs-install';

export const OCSStorageClassDropdown: React.FC<OCSStorageClassDropdownProps> = (props) => (
  <Firehose resources={[{ kind: 'StorageClass', prop: 'StorageClass', isList: true }]}>
    <StorageClassDropdown {...props} />
  </Firehose>
);

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

type OCSStorageClassDropdownProps = {
  id?: string;
  loaded?: boolean;
  resources?: any;
  name: string;
  onChange: (object) => void;
  describedBy?: string;
  defaultClass: string;
  required?: boolean;
  hideClassName?: string;
};
