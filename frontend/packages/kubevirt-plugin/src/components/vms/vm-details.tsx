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
import { VMUsersList } from './vm-users';
import { useGuestAgentInfo } from '../../hooks/use-guest-agent-info';
import { GuestAgentInfoWrapper } from '../../k8s/wrapper/vm/guest-agent-info/guest-agent-info-wrapper';
import { VMTabProps, IsPendingChange } from './types';
import { getVMStatus } from '../../statuses/vm/vm-status';
import { VMStatusBundle } from '../../statuses/vm/types';
import { isWindows } from '../../selectors/vm/combined';
import { isVM, isVMI } from '../../selectors/check-type';
import { HashAnchor } from '../hash-anchor/hash-anchor';
import { Alert, AlertVariant, List, ListItem, Button } from '@patternfly/react-core';
import { detectNextRunChanges } from '../../selectors/vm-like/nextRunChanges';
import { VMCDRomModal } from '../modals/cdrom-vm-modal/vm-cdrom-modal';
import { vmFlavorModal } from '../modals/vm-flavor-modal/vm-flavor-modal';
import { BootOrderModal } from '../modals/boot-order-modal/boot-order-modal';

import './vm-details.scss';

export const VMDetailsFirehose: React.FC<VMTabProps> = ({
  obj: objProp,
  vm: vmProp,
  vmis: vmisProp,
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
      : isVMI(vmisProp[0])
      ? vmisProp[0]
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

  const [guestAgentInfoRaw] = useGuestAgentInfo({ vmi });
  const guestAgentInfo = new GuestAgentInfoWrapper(guestAgentInfoRaw);
  const operatingSystemID = guestAgentInfo.getOSInfo().getId();

  const OSMismatchExists =
    vmi && guestAgentInfoRaw && isWindows(vmiLike) !== (operatingSystemID === 'mswindows');
  const OSMismatchAlert = OSMismatchExists && (
    <Alert className="co-alert" variant="warning" title="Operating system mismatch" isInline>
      The operating system defined for this virtual machine does not match what is being reported by
      the Guest Agent. In order to correct this, you need to re-create the virtual machine with the
      correct VM selection. The disks of this virtual machine can be attached to the newly created
      one.
    </Alert>
  );
  const vmConfChanges = detectNextRunChanges(vm, vmi);
  const isVMRequireRestart = !!vmi && Object.values(vmConfChanges).some((x) => !!x);

  const openModal = (key) => {
    switch (key) {
      case IsPendingChange.flavor:
        vmFlavorModal({ vmLike: vm, blocking: true });
        break;
      case IsPendingChange.cdroms:
        VMCDRomModal({ vmLikeEntity: vm, modalClassName: 'modal-lg' });
        break;
      case IsPendingChange.bootOrder:
        BootOrderModal({ vmLikeEntity: vm, modalClassName: 'modal-lg' });
        break;
      default:
        break;
    }
  };

  return (
    <StatusBox data={vmiLike} {...restProps}>
      <ScrollToTopOnMount />
      <div className="co-m-pane__body">
        {OSMismatchAlert}
        <HashAnchor hash="details" />
        <SectionHeading text={`${kindObj.label} Details`} />
        {kindObj === VirtualMachineModel && isVMRequireRestart && (
          <Alert
            title="Pending Changes"
            isInline
            variant={AlertVariant.warning}
            className="kv-vm__pending-changes-alert"
          >
            <List>
              {Object.keys(vmConfChanges).map(
                (key) =>
                  vmConfChanges[key] && (
                    <ListItem key={key}>
                      <Button onClick={() => openModal(key)} isInline variant="link">
                        {key}
                      </Button>
                    </ListItem>
                  ),
              )}
            </List>
          </Alert>
        )}
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
      <div id="scheduling" className="co-m-pane__body">
        <HashAnchor hash="scheduling" />
        <SectionHeading text="Scheduling and resources requirements" />
        <div className="row">
          <VMSchedulingList kindObj={kindObj} canUpdateVM={canUpdate} vm={vm} vmi={vmi} />
        </div>
      </div>
      <div id="services" className="co-m-pane__body">
        <HashAnchor hash="services" />
        <SectionHeading text="Services" />
        <ServicesList {...restProps} data={vmServicesData} label="Services" />
      </div>
      <div id="logged-in-users" className="co-m-pane__body">
        <HashAnchor hash="logged-in-users" />
        <SectionHeading text="Logged in users" />
        <VMUsersList {...restProps} vmi={vmi} vmStatusBundle={vmStatusBundle} />
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
