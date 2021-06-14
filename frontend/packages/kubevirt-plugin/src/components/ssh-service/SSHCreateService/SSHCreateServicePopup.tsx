import * as React from 'react';
import { Popover, PopoverPosition } from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';
import { Trans, useTranslation } from 'react-i18next';
import { ResourceIcon } from '@console/internal/components/utils/resource-icon';
import { VirtualMachineModel } from '../../../models/index';
import { preventDefault } from '../../form/utils';
import SSHCreateServiceMessage from './SSHCreateServiceMessage';

type SSHCreateServicePopupProps = {
  vmName?: string;
  hidePopup?: boolean;
};

const SSHCreateServicePopup: React.FC<SSHCreateServicePopupProps> = ({ vmName, hidePopup }) => {
  const { t } = useTranslation();
  return (
    <>
      {vmName ? (
        <Trans ns="kubevirt-plugin" t={t}>
          Expose SSH access for <ResourceIcon kind={VirtualMachineModel.kind} /> {vmName}
        </Trans>
      ) : (
        t('kubevirt-plugin~Expose SSH access to this virtual machine')
      )}
      {!hidePopup && (
        <Popover position={PopoverPosition.right} bodyContent={SSHCreateServiceMessage}>
          <button type="button" onClick={preventDefault} className="pf-c-form__group-label-help">
            <HelpIcon noVerticalAlign />
          </button>
        </Popover>
      )}
    </>
  );
};

export default SSHCreateServicePopup;
