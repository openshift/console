import * as React from 'react';
import { getResource, getServicesForVm } from 'kubevirt-web-ui-components';
import {
  Firehose,
  StatusBox,
  ScrollToTopOnMount,
  SectionHeading,
  FirehoseResult,
  useAccessReview,
  asAccessReview,
} from '@console/internal/components/utils';
import { getNamespace } from '@console/shared';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { ServiceModel } from '@console/internal/models';
import { ServicesList } from '@console/internal/components/service';
import { VMKind, VMIKind } from '../../types';
import { getLoadedData } from '../../utils';
import { VirtualMachineInstanceModel } from '../../models';
import { VMResourceSummary, VMDetailsList } from './vm-resource';
import { VMTabProps } from './types';

export const VMDetailsFirehose: React.FC<VMTabProps> = ({ obj: vm, vmi, pods, migrations }) => {
  const resources = [getResource(ServiceModel, { namespace: getNamespace(vm), prop: 'services' })];

  return (
    <div className="co-m-pane__body">
      <Firehose resources={resources}>
        <VMDetails vm={vm} vmi={vmi} pods={pods} migrations={migrations} />
      </Firehose>
    </div>
  );
};

const VMDetails: React.FC<VMDetailsProps> = (props) => {
  const { vm, vmi, pods, migrations, ...restProps } = props;
  const mainResources = {
    vm,
    vmi,
    pods,
    migrations,
  };

  const vmServicesData = getServicesForVm(getLoadedData(props.services, []), vm);

  const canUpdate = useAccessReview(asAccessReview(VirtualMachineInstanceModel, vm, 'patch'));

  return (
    <StatusBox data={vm} {...restProps}>
      <ScrollToTopOnMount />
      <div className="co-m-pane__body">
        <SectionHeading text="VM Overview" />
        <div className="row">
          <div className="col-sm-6">
            <VMResourceSummary canUpdateVM={canUpdate} {...mainResources} />
          </div>
          <div className="col-sm-6">
            <VMDetailsList {...mainResources} />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Services" />
        <ServicesList {...restProps} data={vmServicesData} />
      </div>
    </StatusBox>
  );
};

type VMDetailsProps = {
  vm: VMKind;
  pods?: PodKind[];
  migrations?: K8sResourceKind[];
  vmi?: VMIKind;
  services?: FirehoseResult<K8sResourceKind[]>;
};
