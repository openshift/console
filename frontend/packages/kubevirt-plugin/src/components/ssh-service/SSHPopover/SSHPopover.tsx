import * as React from 'react';
import { Text, TextVariants } from '@patternfly/react-core';
import { Trans, useTranslation } from 'react-i18next';
import { FieldLevelHelp } from '@console/internal/components/utils';

import './ssh-popover.scss';

const SSHPopover: React.FC = () => {
  const { t } = useTranslation();
  return (
    <FieldLevelHelp testId="ssh-popover-button">
      <div data-test="ssh-popover">
        <Trans t={t} ns="kubevirt-plugin">
          <Text component={TextVariants.h6}>Remember authorized SSH key</Text>
          <Text component={TextVariants.p}>
            Store the key in a project secret. Suggest the key next time you create a virtual
            machine.
          </Text>
          <Text component={TextVariants.p}>
            The key will be stored after the machine is created
          </Text>
        </Trans>
      </div>
    </FieldLevelHelp>
  );
};

export default SSHPopover;
