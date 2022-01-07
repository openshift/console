import * as React from 'react';
import { Button, Popover, PopoverPosition, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { humanizeBinaryBytes, useAccessReview2 } from '@console/internal/components/utils';
import { K8sVerb, TemplateKind } from '@console/internal/module/k8s';
import { VIRTUALMACHINES_TEMPLATES_BASE_URL } from '../../../constants/url-params';
import { useSupportModal } from '../../../hooks/use-support-modal';
import { VirtualMachineModel } from '../../../models';
import {
  getTemplateMemory,
  getTemplateSizeRequirementInBytes,
} from '../../../selectors/vm-template/advanced';
import { selectVM } from '../../../selectors/vm-template/basic';
import { vCPUCount } from '../../../selectors/vm/cpu';
import {
  getCPU,
  getOperatingSystemName,
  getWorkloadProfile,
} from '../../../selectors/vm/selectors';
import { TemplateSourceStatus } from '../../../statuses/template/types';
import { permissionsErrorModal } from '../../modals/permissions-error-modal/permissions-error-modal';
import { createVMAction } from '../utils';
import './vm-template-table.scss';

type VMTemplateDetailsBodyProps = {
  template: TemplateKind;
  sourceStatus: TemplateSourceStatus;
  disableFullDetails: boolean;
};

const VMTemplateDetailsBody: React.FC<VMTemplateDetailsBodyProps> = ({
  template,
  sourceStatus,
  disableFullDetails,
}) => {
  const { t } = useTranslation();
  const osName = getOperatingSystemName(template);
  const storage = getTemplateSizeRequirementInBytes(template, sourceStatus);
  return (
    <Stack hasGutter>
      {osName && <StackItem>{osName}</StackItem>}
      <StackItem>
        <div className="kubevirt-vm-template-popover">
          <div>{t('kubevirt-plugin~Storage')}</div>
          <div>
            {storage ? humanizeBinaryBytes(storage).string : t('kubevirt-plugin~Not available')}
          </div>
        </div>
        <div className="kubevirt-vm-template-popover">
          <div>{t('kubevirt-plugin~Memory')}</div>
          <div>{getTemplateMemory(template)}</div>
        </div>
        <div className="kubevirt-vm-template-popover">
          <div>{t('kubevirt-plugin~CPU')}</div>
          <div>{vCPUCount(getCPU(selectVM(template)))}</div>
        </div>
        <div className="kubevirt-vm-template-popover">
          <div>{t('kubevirt-plugin~Workload profile')}</div>
          <div>{getWorkloadProfile(template) ?? t('kubevirt-plugin~Not available')}</div>
        </div>
      </StackItem>
      {!disableFullDetails && (
        <StackItem>
          <Link
            to={`/k8s/ns/${template.metadata.namespace}/${VIRTUALMACHINES_TEMPLATES_BASE_URL}/${template.metadata.name}`}
            data-test-id={template.metadata.name}
            className="co-resource-item__resource-name"
          >
            {t('kubevirt-plugin~View full details')}
          </Link>
        </StackItem>
      )}
    </Stack>
  );
};

type RowActionsProps = {
  template: TemplateKind;
  namespace: string;
  sourceStatus: TemplateSourceStatus;
  disableCreate?: boolean;
};

const RowActions: React.FC<RowActionsProps> = ({
  template,
  sourceStatus,
  namespace,
  disableCreate,
}) => {
  const { t } = useTranslation();
  const [createVmAllowed] = useAccessReview2({
    namespace,
    group: VirtualMachineModel.apiGroup,
    resource: VirtualMachineModel.plural,
    verb: 'create' as K8sVerb,
  });
  const withSupportModal = useSupportModal();
  const createVm = () => {
    createVmAllowed
      ? withSupportModal(template, () => createVMAction(template, sourceStatus, namespace))
      : permissionsErrorModal({
          title: t('kubevirt-plugin~Create Virtual Machine from template'),
          errorMsg: t(
            'kubevirt-plugin~You do not have permissions to create the Virtual Machine. Contact your system administrator for more information.',
          ),
        });
  };

  return (
    <>
      <Popover
        position={PopoverPosition.top}
        headerContent={t('kubevirt-plugin~Template details')}
        bodyContent={
          <VMTemplateDetailsBody
            template={template}
            sourceStatus={sourceStatus}
            disableFullDetails={disableCreate}
          />
        }
      >
        <Button
          variant="link"
          className="kubevirt-vm-template-details"
          data-test="template-details"
        >
          {t('kubevirt-plugin~Details')}
        </Button>
      </Popover>
      <Button
        isDisabled={disableCreate}
        data-test="create-from-template"
        onClick={createVm}
        variant="secondary"
        className="kubevirt-vm-template-details"
      >
        {t('kubevirt-plugin~Create VM')}
      </Button>
    </>
  );
};

export default RowActions;
