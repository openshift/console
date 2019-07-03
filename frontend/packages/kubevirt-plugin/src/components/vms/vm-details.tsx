import * as React from 'react';

import { getResource, getServicesForVm } from 'kubevirt-web-ui-components';

import {
  Firehose,
  StatusBox,
  ScrollToTopOnMount,
  SectionHeading,
  FirehoseResult,
} from '@console/internal/components/utils';

import { getName, getNamespace } from '@console/shared';
import { K8sResourceKind, PodKind } from '@console/internal/module/k8s';
import { PodModel, ServiceModel } from '@console/internal/models';

import { ServicesList } from '@console/internal/components/service';
import { VMKind, VMIKind } from '../../types';
import { VirtualMachineInstanceModel, VirtualMachineInstanceMigrationModel } from '../../models';
import { VMResourceSummary, VMDetailsList } from './vm-resource';
import { getLoadedData } from '../../utils';
import { VMTabProps } from './types';

export const VMDetailsFirehose: React.FC<VMTabProps> = ({ obj: vm }) => {
  const name = getName(vm);
  const namespace = getNamespace(vm);

  const vmiRes = getResource(VirtualMachineInstanceModel, {
    name,
    namespace,
    isList: false,
    prop: 'vmi',
    optional: true,
  });

  const resources = [
    vmiRes,
    getResource(PodModel, { namespace, prop: 'pods' }),
    getResource(VirtualMachineInstanceMigrationModel, { namespace, prop: 'migrations' }),
    getResource(ServiceModel, { namespace, prop: 'services' }),
  ];

  return (
    <div className="co-m-pane__body">
      <Firehose resources={resources}>
        <VMDetails vm={vm} />
      </Firehose>
    </div>
  );
};

const VMDetails: React.FC<VMDetailsProps> = (props) => {
  const { vm, ...restProps } = props;
  const flatResources = {
    vm,
    vmi: getLoadedData(props.vmi),
    pods: getLoadedData(props.pods),
    migrations: getLoadedData(props.migrations),
  };

  const vmServicesData = getServicesForVm(getLoadedData(props.services, []), vm);

  return (
    <StatusBox data={vm} {...restProps}>
      <ScrollToTopOnMount />
      <div className="co-m-pane__body">
        <SectionHeading text="VM Overview" />
        <div className="row">
          <div className="col-sm-6">
            <VMResourceSummary {...flatResources} />
          </div>
          <div className="col-sm-6">
            <VMDetailsList {...flatResources} />
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
  pods?: FirehoseResult<PodKind[]>;
  migrations?: FirehoseResult<K8sResourceKind[]>;
  services?: FirehoseResult<K8sResourceKind[]>;
  vmi?: FirehoseResult<VMIKind>;
};
