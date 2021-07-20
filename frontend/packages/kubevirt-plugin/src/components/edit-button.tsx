import * as React from 'react';
import { Button } from '@patternfly/react-core';

export const EditButton: React.FC<EditButtonProps> = (props) => {
  const { canEdit, onClick, id, children } = props;

  if (canEdit) {
    return (
      <Button
        id={id}
        className="co-modal-btn-link co-modal-btn-link--left"
        variant="link"
        onClick={onClick}
      >
        {children}
      </Button>
    );
  }

  return null;
};

type EditButtonProps = {
  children?: any;
  canEdit: boolean;
  onClick: React.MouseEventHandler;
  id?: string;
};
