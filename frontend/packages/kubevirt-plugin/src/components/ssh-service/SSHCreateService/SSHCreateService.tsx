import * as React from 'react';
import { Checkbox, Alert, Stack, StackItem } from '@patternfly/react-core';
import { ResourceIcon } from '@console/internal/components/utils';
import { useTranslation, Trans } from 'react-i18next';
import { VirtualMachineModel } from '../../../models/index';
import useSSHKeys from '../../../hooks/use-ssh-keys';
import { isEmpty } from 'lodash';

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
