import * as React from 'react';
import { Alert } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ServicesList } from '@console/internal/components/service';
import {
  asAccessReview,
  Firehose,
  FirehoseResult,
  ScrollToTopOnMount,
  SectionHeading,
  StatusBox,
  useAccessReview,
} from '@console/internal/components/utils';
import { ServiceModel } from '@console/internal/models';
import { K8sKind, PodKind } from '@console/internal/module/k8s';
import { getNamespace } from '@console/shared';
import { useGuestAgentInfo } from '../../hooks/use-guest-agent-info';
import { GuestAgentInfoWrapper } from '../../k8s/wrapper/vm/guest-agent-info/guest-agent-info-wrapper';
import { VirtualMachineInstanceModel, VirtualMachineModel } from '../../models';
import { isVM, isVMI } from '../../selectors/check-type';
import { getServicesForVmi } from '../../selectors/service';
import { isWindows } from '../../selectors/vm/combined';
import { VMStatusBundle } from '../../statuses/vm/types';
import { getVMStatus } from '../../statuses/vm/vm-status';
import { VMIKind, VMKind } from '../../types';
import { getLoadedData, getResource } from '../../utils';
import { HashAnchor } from '../hash-anchor/hash-anchor';
import { VMTabProps } from './types';
import { VMDetailsList, VMResourceSummary, VMSchedulingList } from './vm-resource';
import { VMUsersList } from './vm-users';

export const VMDetailsFirehose: React.FC<VMTabProps> = ({
  obj: objProp,
  vm: vmProp,
  vmis: vmisProp,
  vmImports,
  pods,
  migrations,
  pvcs,
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
    pvcs,
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
          vmStatusBundle={vmStatusBundle}
        />
      </Firehose>
    </div>
  );
};

export const VMDetails: React.FC<VMDetailsProps> = (props) => {
  const { t } = useTranslation();

  const { kindObj, vm, vmi, pods, vmStatusBundle, ...restProps } = props;

  const vmiLike = kindObj === VirtualMachineModel ? vm : vmi;
  const vmServicesData = getServicesForVmi(getLoadedData(props.services, []), vmi);
  const canUpdate = useAccessReview(asAccessReview(kindObj, vmiLike || {}, 'patch')) && !!vmiLike;

  const [guestAgentInfoRaw] = useGuestAgentInfo({ vmi });
  const guestAgentInfo = new GuestAgentInfoWrapper(guestAgentInfoRaw);
  const operatingSystemID = guestAgentInfo.getOSInfo().getId();

  const OSMismatchExists =
    vmi && guestAgentInfoRaw && isWindows(vmiLike) !== (operatingSystemID === 'mswindows');
  const OSMismatchAlert = OSMismatchExists && (
    <Alert
      className="co-alert"
      variant="warning"
      title={t('kubevirt-plugin~Operating system mismatch')}
      isInline
    >
      {t(
        'kubevirt-plugin~The operating system defined for this virtual machine does not match what is being reported by the Guest Agent. In order to correct this, you need to re-create the virtual machine with the correct VM selection. The disks of this virtual machine can be attached to the newly created one.',
      )}
    </Alert>
  );

  return (
    <StatusBox data={vmiLike} {...restProps}>
      <ScrollToTopOnMount />
      <div className="co-m-pane__body">
        {OSMismatchAlert}
        <HashAnchor hash="details" />
        <SectionHeading text={t('kubevirt-plugin~{{name}} Details', { name: kindObj.label })} />
        <div className="row">
          <div className="col-sm-6">
            <VMResourceSummary kindObj={kindObj} canUpdateVM={canUpdate} vm={vm} vmi={vmi} />
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
        <SectionHeading text={t('kubevirt-plugin~Scheduling and resources requirements')} />
        <div className="row">
          <VMSchedulingList kindObj={kindObj} canUpdateVM={canUpdate} vm={vm} vmi={vmi} />
        </div>
      </div>
      <div id="services" className="co-m-pane__body">
        <HashAnchor hash="services" />
        <SectionHeading text={t('kubevirt-plugin~Services')} />
        <ServicesList {...restProps} data={vmServicesData} label={t('kubevirt-plugin~Services')} />
      </div>
      <div id="logged-in-users" className="co-m-pane__body">
        <HashAnchor hash="logged-in-users" />
        <SectionHeading text={t('kubevirt-plugin~Active Users')} />
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
  vmStatusBundle?: VMStatusBundle;
};
