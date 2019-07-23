import * as React from 'react';
import { Link } from 'react-router-dom';
import { Button } from 'patternfly-react';
import { Popover, PopoverPosition } from '@patternfly/react-core';

const DashboardCardButtonLink: React.FC<DashboardCardButtonLinkProps> = React.memo(({ children, ...rest }) => (
  <Button bsStyle="link" className="co-dashboard-card__button-link" {...rest}>{children}</Button>
));

export const DashboardCardLink: React.FC<DashboardCardLinkProps> = React.memo(({ children, to }) => (
  <Link to={to} className="co-dashboard-card__link">
    <DashboardCardButtonLink>{children}</DashboardCardButtonLink>
  </Link>
));

export const DashboardCardPopupLink: React.FC<DashboardCardPopupLinkProps> = React.memo(
  ({ linkTitle, popupTitle, children }) => {
    if (React.Children.count(children) === 0) {
      return null;
    }

    return (
      <Popover
        position={PopoverPosition.right}
        headerContent={popupTitle}
        bodyContent={children}
        enableFlip
      >
        <DashboardCardButtonLink>{linkTitle}</DashboardCardButtonLink>
      </Popover>
    );
  }
);

type DashboardCardButtonLinkProps = {
  children: React.ReactNode;
};

type DashboardCardPopupLinkProps = {
  children?: React.ReactNode;
  popupTitle: string;
  linkTitle: string;
};

type DashboardCardLinkProps = DashboardCardButtonLinkProps & {
  to: string;
};
