import * as React from 'react';
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
import { K8sResourceKind, PodKind, TemplateKind } from '@console/internal/module/k8s';
import { ServiceModel } from '@console/internal/models';
import { ServicesList } from '@console/internal/components/service';
import { VMKind, VMIKind } from '../../types';
import { getLoadedData, getResource } from '../../utils';
import { VirtualMachineInstanceModel } from '../../models';
import { getServicesForVmi } from '../../selectors/service';
import { VMResourceSummary, VMDetailsList } from './vm-resource';
import { VMTabProps } from './types';

export const VMDetailsFirehose: React.FC<VMTabProps> = ({
  obj: vm,
  vmi,
  pods,
  migrations,
  templates,
}) => {
  const resources = [getResource(ServiceModel, { namespace: getNamespace(vm), prop: 'services' })];

  return (
    <div className="co-m-pane__body">
      <Firehose resources={resources}>
        <VMDetails vm={vm} vmi={vmi} pods={pods} migrations={migrations} templates={templates} />
      </Firehose>
    </div>
  );
};

const VMDetails: React.FC<VMDetailsProps> = (props) => {
  const { vm, vmi, pods, migrations, templates, ...restProps } = props;
  const mainResources = {
    vm,
    vmi,
    pods,
    migrations,
    templates,
  };

  const vmServicesData = getServicesForVmi(getLoadedData(props.services, []), vmi);

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
            <VMDetailsList canUpdateVM={canUpdate} {...mainResources} />
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
  templates?: TemplateKind[];
};
