import * as React from 'react';

export const EditButton: React.FC<EditButtonProps> = (props) => {
  const { canEdit, onClick, id, children } = props;

  if (canEdit) {
    return (
      <button
        id={id}
        type="button"
        className="btn btn-link co-modal-btn-link co-modal-btn-link--left"
        onClick={onClick}
      >
        {children}
      </button>
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
