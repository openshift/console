import * as React from 'react';
import { Button } from '@patternfly/react-core';

export const EditButton: React.FC<EditButtonProps> = (props) => {
  const { canEdit, onClick } = props;

  if (canEdit) {
    return (
      <Button
        type="button"
        className="btn btn-link co-modal-btn-link co-modal-btn-link--left"
        onClick={onClick}
      />
    );
  }

  return null;
};

type EditButtonProps = {
  canEdit: boolean;
  onClick: React.MouseEventHandler;
};
