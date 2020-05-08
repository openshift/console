import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';

interface EditButtonProps {
  canEdit: boolean;
  onClick: React.MouseEventHandler;
  id?: string;
  ariaLabel: string;
}

const EditButton: React.FC<EditButtonProps> = (props) => {
  const { ariaLabel, canEdit, onClick, id, ...rest } = props;

  if (canEdit) {
    return (
      <Button
        id={id}
        type="button"
        className="co-m-edit-pencil"
        aria-label={ariaLabel}
        variant="plain"
        onClick={onClick}
        {...rest}
      >
        <PencilAltIcon className="pf-c-button-icon--plain" />
      </Button>
    );
  }

  return null;
};

export default EditButton;
