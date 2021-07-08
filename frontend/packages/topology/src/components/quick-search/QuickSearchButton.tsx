import * as React from 'react';
import { Tooltip, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import QuickSearchIcon from './QuickSearchIcon';
import './QuickSearchButton.scss';

interface QuickSearchButtonProps {
  onClick: () => void;
}

const QuickSearchButton: React.FC<QuickSearchButtonProps> = ({ onClick }) => {
  const { t } = useTranslation();

  return (
    <Tooltip position="right" content={t('topology~Add to Project')}>
      <Button
        className="odc-quick-search-button"
        variant="plain"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        aria-label={t('topology~Quick search button')}
      >
        <QuickSearchIcon />
      </Button>
    </Tooltip>
  );
};

export default QuickSearchButton;
