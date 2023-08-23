import * as React from 'react';
import { Tooltip, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';

interface QuickSearchButtonProps {
  onClick: () => void;
}

const TopologyQuickSearchButton: React.FC<QuickSearchButtonProps> = ({ onClick }) => {
  const { t } = useTranslation();

  return (
    <Tooltip position="right" content={t('topology~Add to Project')}>
      <Button
        className="odc-topology-quick-search-button"
        data-test="quick-search"
        isBlock
        variant="control"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        aria-label={t('topology~Add to Project')}
      >
        <i className="fa fa-search pf-u-pr-sm" />
        {t('devconsole~Search / Add to Project')}
      </Button>
    </Tooltip>
  );
};

export default TopologyQuickSearchButton;
