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
import { K8sKind, PodKind, TemplateKind } from '@console/internal/module/k8s';
import { ServiceModel } from '@console/internal/models';
import { ServicesList } from '@console/internal/components/service';
import { VMKind, VMIKind } from '../../types';
import { getLoadedData, getResource } from '../../utils';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { getServicesForVmi } from '../../selectors/service';
import { VMResourceSummary, VMDetailsList, VMSchedulingList } from './vm-resource';
import { VMTabProps } from './types';
import { getVMStatus } from '../../statuses/vm/vm-status';
import { VMStatusBundle } from '../../statuses/vm/types';
import { isVM, isVMI } from '../../selectors/check-type';

export const VMDetailsFirehose: React.FC<VMTabProps> = ({
  obj: objProp,
  vm: vmProp,
  vmi: vmiProp,
  vmImports,
  pods,
  migrations,
  templates,
  dataVolumes,
  customData: { kindObj },
}) => {
  const vm =
    kindObj === VirtualMachineModel && isVM(objProp) ? objProp : isVM(vmProp) ? vmProp : null;
  const vmi =
    kindObj === VirtualMachineInstanceModel && isVMI(objProp)
      ? objProp
      : isVMI(vmiProp)
      ? vmiProp
      : null;

  const resources = [
    getResource(ServiceModel, { namespace: getNamespace(objProp), prop: 'services' }),
  ];

  const vmStatusBundle = getVMStatus({
    vm,
    vmi,
    pods,
    migrations,
    dataVolumes,
    vmImports,
  });

  return (
    <div className="co-m-pane__body">
      <Firehose resources={resources}>
        <VMDetails
          kindObj={kindObj}
          vm={vm}
          vmi={vmi}
          pods={pods}
          templates={templates}
          vmStatusBundle={vmStatusBundle}
        />
      </Firehose>
    </div>
  );
};

export const VMDetails: React.FC<VMDetailsProps> = (props) => {
  const { kindObj, vm, vmi, pods, vmStatusBundle, templates, ...restProps } = props;

  const vmiLike = kindObj === VirtualMachineModel ? vm : vmi;
  const vmServicesData = getServicesForVmi(getLoadedData(props.services, []), vmi);
  const canUpdate = useAccessReview(asAccessReview(kindObj, vmiLike || {}, 'patch')) && !!vmiLike;

  return (
    <StatusBox data={vmiLike} {...restProps}>
      <ScrollToTopOnMount />
      <div className="co-m-pane__body">
        <SectionHeading text={`${kindObj.label} Details`} />
        <div className="row">
          <div className="col-sm-6">
            <VMResourceSummary
              kindObj={kindObj}
              canUpdateVM={canUpdate}
              vm={vm}
              vmi={vmi}
              templates={templates}
            />
          </div>
          <div className="col-sm-6">
            <VMDetailsList
              kindObj={kindObj}
              canUpdateVM={canUpdate}
              vm={vm}
              vmi={vmi}
              pods={pods}
              vmStatusBundle={vmStatusBundle}
            />
          </div>
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Scheduling and resources requirements" />
        <div className="row">
          <VMSchedulingList kindObj={kindObj} canUpdateVM={canUpdate} vm={vm} vmi={vmi} />
        </div>
      </div>
      <div className="co-m-pane__body">
        <SectionHeading text="Services" />
        <ServicesList {...restProps} data={vmServicesData} label="Services" />
      </div>
    </StatusBox>
  );
};

type VMDetailsProps = {
  kindObj: K8sKind;
  vm?: VMKind;
  vmi?: VMIKind;
  pods?: PodKind[];
  services?: FirehoseResult;
  templates?: TemplateKind[];
  vmStatusBundle?: VMStatusBundle;
};
