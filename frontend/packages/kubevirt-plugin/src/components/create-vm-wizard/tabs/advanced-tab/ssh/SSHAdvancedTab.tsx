import * as React from 'react';
import { Stack, StackItem } from '@patternfly/react-core';
import SSHCreateService from '../../../../ssh-service/SSHCreateService/SSHCreateService';

const SSHAdvancedTab = () => {
  return (
    <Stack hasGutter>
      <StackItem>
        <SSHCreateService disableAuthorizedKeyMessage />
      </StackItem>
    </Stack>
  );
};

export default SSHAdvancedTab;
