import * as React from 'react';
import { Button, OverlayTrigger, Popover } from 'patternfly-react';
import { InfoCircleIcon } from '@patternfly/react-icons';

export const DashboardCardHelp: React.FC<DashboardCardTitleHelpProps> = React.memo(({ children }) => {
  if (React.Children.count(children) === 0) {
    return null;
  }
  const overlay = <Popover id="popover">{children}</Popover>;
  return (
    <OverlayTrigger overlay={overlay} placement="top" trigger={['click']} rootClose>
      <Button bsStyle="link">
        <InfoCircleIcon className="co-dashboard-header__icon" />
      </Button>
    </OverlayTrigger>
  );
});

type DashboardCardTitleHelpProps = {
  children: React.ReactNode;
}
