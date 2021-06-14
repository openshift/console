import * as React from 'react';
import { Alert, Checkbox, Stack, StackItem } from '@patternfly/react-core';
import { isEmpty } from 'lodash';
import { useTranslation } from 'react-i18next';
import useSSHKeys from '../../../hooks/use-ssh-keys';
import SSHCreateServiceMessage from './SSHCreateServiceMessage';
import SSHCreateServicePopup from './SSHCreateServicePopup';

import './ssh-service.scss';

type SSHCreateServiceProps = {
  vmName?: string;
  disableAuthorizedKeyMessage?: boolean;
  hidePopup?: boolean;
};

const SSHCreateService: React.FC<SSHCreateServiceProps> = ({
  vmName,
  disableAuthorizedKeyMessage = false,
  hidePopup = false,
}) => {
  const { t } = useTranslation();
  const { enableSSHService, tempSSHKey, setEnableSSHService } = useSSHKeys();

  return (
    <Stack hasGutter>
      <StackItem>
        <Checkbox
          id="ssh-service-checkbox"
          className="kv-ssh-service-checkbox--main"
          label={<SSHCreateServicePopup vmName={vmName} hidePopup={hidePopup} />}
          isChecked={enableSSHService}
          onChange={(checked) => {
            setEnableSSHService(checked);
          }}
        />
      </StackItem>
      {isEmpty(tempSSHKey) && enableSSHService && !disableAuthorizedKeyMessage && (
        <StackItem>
          <Alert
            variant="info"
            data-test="SSHCreateService-info-message"
            isInline
            title={t('kubevirt-plugin~Missing authorized key')}
          >
            {t(
              `kubevirt-plugin~An authorized key is not detected. SSH access is enabled with the password.`,
            )}
          </Alert>
        </StackItem>
      )}
      {hidePopup && (
        <StackItem>
          <Alert variant="info" isInline title={t('kubevirt-plugin~Node port')}>
            <SSHCreateServiceMessage />
          </Alert>
        </StackItem>
      )}
    </Stack>
  );
};

export default SSHCreateService;
