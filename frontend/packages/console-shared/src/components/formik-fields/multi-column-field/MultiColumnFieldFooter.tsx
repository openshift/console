import * as React from 'react';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { Button } from '@patternfly/react-core';

export interface MultiColumnFieldHeader {
  addLabel?: string;
  onAdd: () => void;
  disableAddRow?: boolean;
}

const MultiColumnFieldFooter: React.FC<MultiColumnFieldHeader> = ({
  addLabel,
  onAdd,
  disableAddRow = false,
}) => (
  <Button
    variant="link"
    isDisabled={disableAddRow}
    onClick={onAdd}
    icon={<PlusCircleIcon />}
    isInline
  >
    {addLabel || 'Add'}
  </Button>
);

export default MultiColumnFieldFooter;
