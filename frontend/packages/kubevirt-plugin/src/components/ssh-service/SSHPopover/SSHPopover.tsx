import * as React from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { Popover, PopoverPosition, Text, TextVariants } from '@patternfly/react-core';
import { HelpIcon } from '@patternfly/react-icons';

import './ssh-popover.scss';

const SSHPopover: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Popover
      data-test="SSHPopover"
      className="SSHPopover-main"
      maxWidth="20%"
      position={PopoverPosition.right}
      bodyContent={
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
      }
    >
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
        className="pf-c-form__group-label-help SSHPopover-button"
      >
        {' '}
        <HelpIcon noVerticalAlign />
      </button>
    </Popover>
  );
};

export default SSHPopover;
