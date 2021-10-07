import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { PencilAltIcon } from '@patternfly/react-icons';

type VMEditWithPencilProps = {
  onEditClick: React.MouseEventHandler;
  isEdit: boolean;
  ButtonID?: string;
};

const VMEditWithPencil: React.FC<VMEditWithPencilProps> = ({
  children,
  isEdit,
  onEditClick,
  ButtonID,
}) => {
  return (
    <Button
      id={ButtonID}
      data-test="edit-button"
      type="button"
      isInline
      isDisabled={!isEdit}
      onClick={onEditClick}
      variant="link"
    >
      {children}
      {isEdit && <PencilAltIcon className="co-icon-space-l pf-c-button-icon--plain" />}
    </Button>
  );
};

export default VMEditWithPencil;
