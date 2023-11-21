import * as React from 'react';
import { ActionGroup, Button, ButtonVariant } from '@patternfly/react-core';
import { CheckIcon } from '@patternfly/react-icons/dist/esm/icons/check-icon';
import CloseButton from '../close-button/CloseButton';
import { ActionGroupWithIconsProps } from './form-utils-types';

const ActionGroupWithIcons: React.FC<ActionGroupWithIconsProps> = ({
  onSubmit,
  onClose,
  isDisabled,
}) => {
  return (
    <ActionGroup className="pf-v5-c-form pf-v5-c-form__actions--right">
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
      <CloseButton
        additionalClassName="co-close-button--no-padding"
        dataTestID="close-icon"
        onClick={onClose}
      />
    </ActionGroup>
  );
};

export default ActionGroupWithIcons;
