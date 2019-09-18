import * as React from 'react';
import { Button, Popover } from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';

export const DashboardCardHelp: React.FC<DashboardCardTitleHelpProps> = React.memo(({ children }) => {
  if (React.Children.count(children) === 0) {
    return null;
  }
  return (
    <Popover
      appendTo={() => document.getElementById('content-scrollable')}
      aria-label="Help"
      bodyContent={children}
      enableFlip
    >
      <Button variant="link" isInline>
        <InfoCircleIcon className="co-dashboard-icon" />
      </Button>
    </Popover>
  );
});

type DashboardCardTitleHelpProps = {
  children: React.ReactNode;
}
