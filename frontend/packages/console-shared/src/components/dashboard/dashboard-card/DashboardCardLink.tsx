import * as React from 'react';
import classNames from 'classnames';
import { Link } from 'react-router-dom';
import { Button, ButtonProps, Popover, PopoverPosition } from '@patternfly/react-core';

export const DashboardCardButtonLink: React.FC<DashboardCardButtonLinkProps> = React.memo(
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

const DashboardCardLink: React.FC<DashboardCardLinkProps> = React.memo(({ children, to }) => (
  <Link to={to} className="co-dashboard-card__link">
    {children}
  </Link>
));

export const DashboardCardPopupLink: React.FC<DashboardCardPopupLinkProps> = React.memo(
  ({
    linkTitle,
    popupTitle,
    children,
    className,
    onShow,
    onHide,
    position = PopoverPosition.right,
  }) => {
    if (React.Children.count(children) === 0) {
      return null;
    }

    return (
      <Popover
        position={position}
        headerContent={popupTitle}
        bodyContent={children}
        enableFlip
        onShow={onShow}
        onHide={onHide}
        maxWidth="21rem"
      >
        <DashboardCardButtonLink className={className}>{linkTitle}</DashboardCardButtonLink>
      </Popover>
    );
  },
);

export default DashboardCardLink;

type DashboardCardButtonLinkProps = ButtonProps & {
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
  position?: PopoverPosition;
};

type DashboardCardLinkProps = DashboardCardButtonLinkProps & {
  to: string;
};
