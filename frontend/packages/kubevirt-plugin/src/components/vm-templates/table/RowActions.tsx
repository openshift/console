import * as React from 'react';
import { Button, Popover, PopoverPosition, Stack, StackItem } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { humanizeBinaryBytes } from '@console/internal/components/utils';
import { TemplateKind } from '@console/internal/module/k8s';
import { useSupportModal } from '../../../hooks/use-support-modal';
import {
  getCPU,
  getOperatingSystemName,
  getWorkloadProfile,
  vCPUCount,
} from '../../../selectors/vm';
import {
  getTemplateMemory,
  getTemplateSizeRequirementInBytes,
} from '../../../selectors/vm-template/advanced';
import { isLabeledTemplate, selectVM } from '../../../selectors/vm-template/basic';
import { TemplateSourceStatus } from '../../../statuses/template/types';
import { VMTemplateLabel } from '../label';
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
  const isLabel = isLabeledTemplate(t, template);
  return (
    <Stack hasGutter>
      {isLabel && (
        <StackItem>
          <VMTemplateLabel template={template} />
        </StackItem>
      )}
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
            to={`/k8s/ns/${template.metadata.namespace}/vmtemplates/${template.metadata.name}`}
            title={template.metadata.uid}
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
  const withSupportModal = useSupportModal();
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
        onClick={() =>
          withSupportModal(template, () => createVMAction(template, sourceStatus, namespace))
        }
        variant="secondary"
        className="kubevirt-vm-template-details"
      >
        {t('kubevirt-plugin~Create VM')}
      </Button>
    </>
  );
};

export default RowActions;
