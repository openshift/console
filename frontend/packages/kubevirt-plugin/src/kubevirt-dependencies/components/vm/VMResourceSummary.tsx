import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ResourceSummary } from '@console/internal/components/utils';
import { K8sKind } from '@console/internal/module/k8s';
import {
  LABEL_USED_TEMPLATE_NAME,
  LABEL_USED_TEMPLATE_NAMESPACE,
} from '../../constants/vm/constants';
import { useGuestAgentInfo } from '../../hooks/useGuestAgentInfo';
import { GuestAgentInfoWrapper } from '../../k8s/wrapper/vm/guest-agent-info/guest-agent-info-wrapper';
import { VirtualMachineModel } from '../../models';
import { getDescription, getLabel } from '../../selectors/k8sCommon';
import { getOperatingSystem, getOperatingSystemName } from '../../selectors/vm/selectors';
import { getVMLikeModel } from '../../selectors/vm/vmLike';
import { VMKind } from '../../types/vm';
import { VMIKind } from '../../types/vmi';
import { getBasicID, prefixedID } from '../../utils/utils';
import { descriptionModal } from '../modals/description-modal/description-modal';
import VMDetailsItem from './VMDetailsItem';
import VMDetailsItemTemplate from './VMDetailsItemTemplate';
import VMEditWithPencil from './VMEditWithPencil';

type VMResourceSummaryProps = {
  kindObj: K8sKind;
  vm?: VMKind;
  vmi?: VMIKind;
  canUpdateVM: boolean;
};

export const VMResourceSummary: React.FC<VMResourceSummaryProps> = ({
  vm,
  vmi,
  canUpdateVM,
  kindObj,
}) => {
  const { t } = useTranslation();

  const isVM = kindObj === VirtualMachineModel;
  const vmiLike = isVM ? vm : vmi;

  const templateName = getLabel(vm, LABEL_USED_TEMPLATE_NAME);
  const templateNamespace = getLabel(vm, LABEL_USED_TEMPLATE_NAMESPACE);

  const id = getBasicID(vmiLike);
  const description = getDescription(vmiLike);
  const os = getOperatingSystemName(vmiLike) || getOperatingSystem(vmiLike);

  const [guestAgentInfoRaw] = useGuestAgentInfo({ vmi });
  const guestAgentInfo = new GuestAgentInfoWrapper(guestAgentInfoRaw);
  const operatingSystem = guestAgentInfo.getOSInfo().getPrettyName();

  return (
    <ResourceSummary resource={vmiLike}>
      <VMDetailsItem
        title={t('kubevirt-plugin~Description')}
        idValue={prefixedID(id, 'description')}
        valueClassName="kubevirt-vm-resource-summary__description"
      >
        {!description && (
          <span className="text-secondary">{t('kubevirt-plugin~Not available')}</span>
        )}
        <VMEditWithPencil
          isEdit={canUpdateVM}
          onEditClick={() => descriptionModal({ resource: vmiLike, kind: getVMLikeModel(vmiLike) })}
        >
          {description}
        </VMEditWithPencil>
      </VMDetailsItem>

      <VMDetailsItem
        title={t('kubevirt-plugin~Operating system')}
        idValue={prefixedID(id, 'os')}
        isNotAvail={!(operatingSystem || os)}
      >
        {operatingSystem || os}
      </VMDetailsItem>

      {isVM && <VMDetailsItemTemplate name={templateName} namespace={templateNamespace} />}
    </ResourceSummary>
  );
};
