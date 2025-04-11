import * as React from 'react';
import { Tooltip, Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import QuickSearchIcon from '@console/shared/src/components/quick-search/QuickSearchIcon';

interface QuickSearchButtonProps {
  onClick: () => void;
}

const TopologyQuickSearchButton: React.FC<QuickSearchButtonProps> = ({ onClick }) => {
  const { t } = useTranslation();

  return (
    <Tooltip position="bottom" content={t('topology~Add to Project')}>
      <Button
        icon={<QuickSearchIcon height="2rem" width="2rem" />}
        className="co-xl-icon-button"
        data-test="quick-search"
        variant="plain"
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        aria-label={t('topology~Quick search button')}
      />
    </Tooltip>
  );
};

export default TopologyQuickSearchButton;
