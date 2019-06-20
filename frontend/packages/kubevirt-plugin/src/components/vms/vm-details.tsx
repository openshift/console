import * as React from 'react';
import * as _ from 'lodash';

import { getResource, getServicesForVm } from 'kubevirt-web-ui-components';

import {
  Firehose,
  StatusBox,
  ScrollToTopOnMount,
  SectionHeading,
} from '@console/internal/components/utils';

import { PodKind } from '@console/internal/module/k8s';
import { PodModel, ServiceModel } from '@console/internal/models';

import { ServicesList } from '@console/internal/components/service';
import { VMKind, VMIKind } from '../../types';
import { VirtualMachineInstanceModel, VirtualMachineInstanceMigrationModel } from '../../models';
import { VMResourceSummary, VMDetailsList } from './vm-resource';

export const VMDetailsFirehose = ({ obj: vm }: { obj: VMKind }) => {
  const { name, namespace } = vm.metadata;

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

const VMDetails = (props: VMDetailsProps) => {
  const { vm, ...restProps } = props;
  const flatResources = {
    vm,
    vmi: _.get(props, 'vmi.data'),
    pods: _.get(props, 'pods.data'),
    migrations: _.get(props, 'migrations.data'),
  };

  const vmServicesData = getServicesForVm(_.get(props, 'services', {}).data, vm);

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
  pods?: PodKind[];
  migrations?: any[];
  vmi?: VMIKind;
};
