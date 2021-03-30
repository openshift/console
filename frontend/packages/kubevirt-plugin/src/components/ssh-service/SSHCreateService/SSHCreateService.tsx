import * as React from 'react';
import { Checkbox, Alert, Stack, StackItem } from '@patternfly/react-core';
import { ResourceIcon } from '@console/internal/components/utils';
import { useTranslation, Trans } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';
import { SSHActionsNames, sshActions } from '../redux/actions';
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
  const dispatch = useDispatch();
  const { enableSSHService, tempSSHKey } = useSSHKeys();
  const onSSHServiceChange = React.useCallback(
    (val: boolean) => dispatch(sshActions[SSHActionsNames.enableSSHService](val)),
    [dispatch],
  );

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
            onSSHServiceChange(checked);
          }}
        />
      </StackItem>
      {isEmpty(tempSSHKey) && enableSSHService && !disableAuthorizedKeyMessage && (
        <StackItem>
          <Alert
            variant="info"
            isInline
            title={t(
              `kubevirt-plugin~We haven't detected authorized key for the SSH access. SSH access will be enabled without authorized key`,
            )}
          />
        </StackItem>
      )}
    </Stack>
  );
};

export default SSHCreateService;
