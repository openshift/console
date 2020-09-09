import * as React from 'react';
import { ActionGroup, Button, ButtonVariant } from '@patternfly/react-core';
import { CheckIcon, CloseIcon } from '@patternfly/react-icons';
import { ActionGroupWithIconsProps } from './form-utils-types';

const ActionGroupWithIcons: React.FC<ActionGroupWithIconsProps> = ({
  onSubmit,
  onClose,
  isDisabled,
}) => {
  return (
    <ActionGroup className="pf-c-form pf-c-form__actions--right">
      {onSubmit && (
        <Button
          type="submit"
          onClick={onSubmit}
          variant={ButtonVariant.plain}
          data-test-id="check-icon"
          style={{ padding: '0' }}
          isDisabled={isDisabled}
        >
          <CheckIcon />
        </Button>
      )}
      <Button
        type="button"
        data-test-id="close-icon"
        variant={ButtonVariant.plain}
        onClick={onClose}
        style={{ padding: '0' }}
      >
        <CloseIcon />
      </Button>
    </ActionGroup>
  );
};

export default ActionGroupWithIcons;
