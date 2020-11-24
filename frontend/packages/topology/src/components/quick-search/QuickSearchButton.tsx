import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Tooltip, Button } from '@patternfly/react-core';
import QuickSearchIcon from './QuickSearchIcon';
import './QuickSearchButton.scss';

interface QuickSearchButtonProps {
  onClick: () => void;
}

const QuickSearchButton: React.FC<QuickSearchButtonProps> = ({ onClick }) => {
  const { t } = useTranslation();

  return (
    <Tooltip position="right" content={t('topology~Add to project')}>
      <Button
        className="odc-quick-search-button"
        variant="plain"
        onClick={onClick}
        aria-label={t('topology~Quick Search Button')}
      >
        <QuickSearchIcon />
      </Button>
    </Tooltip>
  );
};

export default QuickSearchButton;
