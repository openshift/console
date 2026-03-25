import type { FC } from 'react';
import { CloseButton } from '@patternfly/react-component-groups';
import { ActionGroup, Button, ButtonVariant } from '@patternfly/react-core';
import { CheckIcon } from '@patternfly/react-icons/dist/esm/icons/check-icon';
import type { ActionGroupWithIconsProps } from './form-utils-types';

const ActionGroupWithIcons: FC<ActionGroupWithIconsProps> = ({ onSubmit, onClose, isDisabled }) => {
  return (
    <ActionGroup className="pf-v6-c-form pf-v6-c-form__actions--right">
      {onSubmit && (
        <Button
          icon={<CheckIcon />}
          type="submit"
          onClick={onSubmit}
          variant={ButtonVariant.plain}
          data-test-id="check-icon"
          style={{ padding: '0' }}
          isDisabled={isDisabled}
        />
      )}
      <CloseButton className="pf-v6-u-p-0" dataTestID="close-icon" onClick={onClose} />
    </ActionGroup>
  );
};

export default ActionGroupWithIcons;
