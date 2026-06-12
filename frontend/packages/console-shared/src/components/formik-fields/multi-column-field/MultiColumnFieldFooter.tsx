import type { FC } from 'react';
import { Button, Tooltip } from '@patternfly/react-core';
import { RhUiAddCircleFillIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';

interface MultiColumnFieldFooterProps {
  addLabel?: string;
  disableAddRow?: boolean;
  hideAddRow?: boolean;
  tooltipAddRow?: string;
  onAdd: () => void;
}

const MultiColumnFieldFooter: FC<MultiColumnFieldFooterProps> = ({
  addLabel,
  disableAddRow = false,
  tooltipAddRow,
  hideAddRow = false,
  onAdd,
}) => {
  const { t } = useTranslation('console-shared');
  const button = (
    <Button
      data-test={'add-action'}
      variant="link"
      isAriaDisabled={disableAddRow}
      onClick={!disableAddRow ? onAdd : undefined}
      icon={<RhUiAddCircleFillIcon />}
      isInline
    >
      {addLabel || t('Add values')}
    </Button>
  );
  return (
    !hideAddRow && (tooltipAddRow ? <Tooltip content={tooltipAddRow}>{button}</Tooltip> : button)
  );
};

export default MultiColumnFieldFooter;
