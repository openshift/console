import * as React from 'react';
import SSHCreateService from '../../../../ssh-service/SSHCreateService/SSHCreateService';
import { Stack, StackItem } from '@patternfly/react-core';

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
