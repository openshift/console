import * as React from 'react';
import { Spinner, Stack } from '@patternfly/react-core';
import { VMIKind, VMKind } from '@console/kubevirt-plugin/src/types';
import useSSHKeys from '../../../hooks/use-ssh-keys';
import SSHFormKey from './SSHFormKey/SSHFormKey';

import './ssh-form.scss';

export type SSHFormProps = { className?: string; vm?: VMIKind | VMKind };

const SSHForm: React.FC<SSHFormProps> = ({ vm, className = '' }) => {
  const { key, isSecretLoaded, secretLoadingError } = useSSHKeys(vm);
  return (
    <Stack className={`pf-global--BackgroundColor--100 ${className}`}>
      {key || isSecretLoaded || secretLoadingError ? <SSHFormKey /> : <Spinner size="lg" />}
    </Stack>
  );
};

export default SSHForm;
