import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { PlusCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

export interface MultiColumnFieldHeader {
  addLabel?: string;
  onAdd: () => void;
  disableAddRow?: boolean;
}

const MultiColumnFieldFooter: React.FC<MultiColumnFieldHeader> = ({
  addLabel,
  onAdd,
  disableAddRow = false,
}) => {
  const { t } = useTranslation();
  return (
    <Button
      data-test={'add-action'}
      variant="link"
      isDisabled={disableAddRow}
      onClick={onAdd}
      icon={<PlusCircleIcon />}
      isInline
    >
      {addLabel || t('console-shared~Add values')}
    </Button>
  );
};

export default MultiColumnFieldFooter;
