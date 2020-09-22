import * as React from 'react';
import { Label } from '@patternfly/react-core';
import { RocketIcon } from '@patternfly/react-icons';
import { history } from '../../utils';

import './quick-start-badge.scss';

const HIDE_QUICK_START_BADGE_STORAGE_KEY = 'bridge/hide-quick-start-badge';

const QuickStartBadge: React.FC = () => {
  const isQuickStartBadgeHidden =
    localStorage.getItem(HIDE_QUICK_START_BADGE_STORAGE_KEY) === 'true';
  const [showQuickStartBadge, setShowQuickStartBadge] = React.useState<boolean>(
    !isQuickStartBadgeHidden,
  );

  const handleQuickStartBadgeClick = (e) => {
    e.stopPropagation();
    e.preventDefault();
    history.push('/quickstart');
  };

  const handleQuickStartBadgeClose = (e) => {
    e.stopPropagation();
    e.preventDefault();
    localStorage.setItem(HIDE_QUICK_START_BADGE_STORAGE_KEY, 'true');
    setShowQuickStartBadge(false);
  };

  if (!showQuickStartBadge) {
    return null;
  }

  return (
    <Label
      color="green"
      className="co-quick-start-badge"
      href="/quickstart"
      icon={<RocketIcon />}
      onClick={handleQuickStartBadgeClick}
      onClose={handleQuickStartBadgeClose}
    >
      Quick start available
    </Label>
  );
};

export default QuickStartBadge;
