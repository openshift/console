import * as React from 'react';
import { Label, Button } from '@patternfly/react-core';
import { RouteIcon } from '@patternfly/react-icons';
import { history } from '../../utils';

const HIDE_QUICK_START_BADGE_STORAGE_KEY = 'bridge/hide-quick-start-badge';

const QuickStartBadge: React.FC = () => {
  const isQuickStartBadgeHidden =
    localStorage.getItem(HIDE_QUICK_START_BADGE_STORAGE_KEY) === 'true';
  const [showQuickStartBadge, setShowQuickStartBadge] = React.useState<boolean>(
    !isQuickStartBadgeHidden,
  );

  const handleQuickStartBadgeClose = () => {
    localStorage.setItem(HIDE_QUICK_START_BADGE_STORAGE_KEY, 'true');
    setShowQuickStartBadge(false);
  };

  if (!showQuickStartBadge) {
    return null;
  }

  return (
    <Label color="green" icon={<RouteIcon />} onClose={handleQuickStartBadgeClose}>
      <Button variant="link" onClick={() => history.push('/quickstart')} isInline>
        Quick start available
      </Button>
    </Label>
  );
};

export default QuickStartBadge;
