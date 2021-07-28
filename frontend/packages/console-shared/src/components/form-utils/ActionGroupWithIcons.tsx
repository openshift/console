import * as React from 'react';
import { ActionGroup, Button, ButtonVariant } from '@patternfly/react-core';
import { CheckIcon } from '@patternfly/react-icons';
import CloseButton from '@console/shared/src/components/close-button';
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
      <CloseButton
        additionalClassName="co-close-button--no-padding"
        dataTestID="close-icon"
        onClick={onClose}
      />
    </ActionGroup>
  );
};

export default ActionGroupWithIcons;
