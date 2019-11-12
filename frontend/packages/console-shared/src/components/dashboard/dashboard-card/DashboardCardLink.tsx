import * as React from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { Button, Popover, PopoverPosition } from '@patternfly/react-core';

const DashboardCardButtonLink: React.FC<DashboardCardButtonLinkProps> = React.memo(
  ({ children, className, ...rest }) => (
    <Button
      variant="link"
      isInline
      className={classNames('co-dashboard-card__button-link', className)}
      {...rest}
    >
      {children}
    </Button>
  ),
);

const DashboardCardLink: React.FC<DashboardCardLinkProps> = React.memo(
  ({ children, to, className }) => (
    <Link to={to} className="co-dashboard-card__link">
      <DashboardCardButtonLink className={className}>{children}</DashboardCardButtonLink>
    </Link>
  ),
);

export const DashboardCardPopupLink: React.FC<DashboardCardPopupLinkProps> = React.memo(
  ({ linkTitle, popupTitle, children, className, onShow, onHide }) => {
    if (React.Children.count(children) === 0) {
      return null;
    }

    return (
      <Popover
        position={PopoverPosition.right}
        headerContent={popupTitle}
        bodyContent={children}
        enableFlip
        onShow={onShow}
        onHide={onHide}
      >
        <DashboardCardButtonLink className={className}>{linkTitle}</DashboardCardButtonLink>
      </Popover>
    );
  },
);

export default DashboardCardLink;

type DashboardCardButtonLinkProps = {
  children: React.ReactNode;
  className?: string;
};

type DashboardCardPopupLinkProps = {
  children?: React.ReactNode;
  popupTitle: string;
  linkTitle: React.ReactNode;
  className?: string;
  onShow?: () => void;
  onHide?: () => void;
};

type DashboardCardLinkProps = DashboardCardButtonLinkProps & {
  to: string;
};
