import * as React from 'react';
import { Checkbox, Flex } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import useSSHKeys from '../../../../hooks/use-ssh-keys';
import SSHPopover from '../../SSHPopover/SSHPopover';

import './ssh-form-save-in-namespace.scss';

const SSHFormSaveInNamespace: React.FC = () => {
  const { t } = useTranslation();
  const {
    disableSaveInNamespaceCheckbox,
    updateSSHKeyInGlobalNamespaceSecret,
    setUpdateSSHKeyInSecret,
  } = useSSHKeys();

  return (
    <Flex className="SSHFormSaveInNamespace-main">
      <Checkbox
        id="ssh-service-checkbox"
        className="SSHFormSaveInNamespace-checkbox"
        label={t(`kubevirt-plugin~Remember Authorized SSH key`)}
        isChecked={updateSSHKeyInGlobalNamespaceSecret}
        isDisabled={disableSaveInNamespaceCheckbox}
        onChange={(checked) => setUpdateSSHKeyInSecret(checked)}
      />
      <SSHPopover />
    </Flex>
  );
};

export default SSHFormSaveInNamespace;
