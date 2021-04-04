import { isEmpty } from 'lodash';
import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { ResourceIcon } from '@console/internal/components/utils';
import { Alert, Checkbox, Stack, StackItem } from '@patternfly/react-core';

import useSSHKeys from '../../../hooks/use-ssh-keys';
import { VirtualMachineModel } from '../../../models/index';

type SSHCreateServiceProps = {
  vmName?: string;
  disableAuthorizedKeyMessage?: boolean;
};

const SSHCreateService: React.FC<SSHCreateServiceProps> = ({
  vmName,
  disableAuthorizedKeyMessage = false,
}) => {
  const { t } = useTranslation();
  const { enableSSHService, tempSSHKey, setEnableSSHService } = useSSHKeys();

  return (
    <Stack hasGutter>
      <StackItem>
        <Checkbox
          id="ssh-service-checkbox"
          label={
            vmName ? (
              <Trans ns="kubevirt-plugin" t={t}>
                Expose SSH access for <ResourceIcon kind={VirtualMachineModel.kind} /> {vmName}
              </Trans>
            ) : (
              t('kubevirt-plugin~Expose SSH access to this virtual machine')
            )
          }
          isChecked={enableSSHService}
          onChange={(checked) => {
            setEnableSSHService(checked);
          }}
        />
      </StackItem>
      {isEmpty(tempSSHKey) && enableSSHService && !disableAuthorizedKeyMessage && (
        <StackItem>
          <Alert variant="info" isInline title={t('kubevirt-plugin~Missing Authorized key')}>
            {t(
              `kubevirt-plugin~We haven't detected authorized key for the SSH access. SSH access will be enabled without authorized key`,
            )}
          </Alert>
        </StackItem>
      )}
    </Stack>
  );
};

export default SSHCreateService;
