import * as classNames from 'classnames';
import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  BlueArrowCircleUpIcon,
  BlueInfoCircleIcon,
  GreenCheckCircleIcon,
  RedExclamationCircleIcon,
  YellowExclamationTriangleIcon,
} from '@console/shared';
import { history, Timestamp } from '@console/internal/components/utils';

export enum NotificationTypes {
  info = 'info',
  warning = 'warning',
  critical = 'danger',
  success = 'success',
  update = 'update',
}

const NotificationIcon: React.FC<NotificationIconTypes> = ({ type }) => {
  switch (type) {
    case NotificationTypes.update:
      return <BlueArrowCircleUpIcon />;
    case NotificationTypes.success:
      return <GreenCheckCircleIcon />;
    case NotificationTypes.critical:
      return <RedExclamationCircleIcon />;
    case NotificationTypes.warning:
      return <YellowExclamationTriangleIcon />;
    case NotificationTypes.info:
    default:
      return <BlueInfoCircleIcon />;
  }
};

const NotificationAction: React.FC<NotificationActionProps> = ({
  onClick,
  text,
  path,
  dataTestID,
}) => (
  <div className="pf-c-notification-drawer__header-action">
    <Link
      data-test-id={dataTestID}
      to={path}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
    >
      {text}
    </Link>
  </div>
);

const NotificationEntry: React.FC<NotificationEntryProps> = ({
  actionText,
  actionPath,
  actionTestID,
  title,
  description,
  isRead = false,
  timestamp,
  targetPath,
  toggleNotificationDrawer,
  type,
}) => (
  <li
    className={classNames(`pf-c-notification-drawer__list-item pf-m-hoverable pf-m-${type}`, {
      'pf-m-read': isRead,
    })}
    tabIndex={0}
    onClick={
      targetPath
        ? () => {
            history.push(targetPath);
            toggleNotificationDrawer();
          }
        : null
    }
  >
    <div className="pf-c-notification-drawer__list-item-header">
      <span className="pf-c-notification-drawer__list-item-header-icon">
        <NotificationIcon type={type} />
      </span>
      <h4 className="pf-c-notification-drawer__list-item-header-title">
        <span className="pf-screen-reader">{`${_.capitalize(type)} notification:`}</span>
        {title}
      </h4>
      {actionText && actionPath && (
        <NotificationAction
          text={actionText}
          path={actionPath}
          dataTestID={actionTestID}
          onClick={toggleNotificationDrawer}
        />
      )}
    </div>
    <div className="pf-c-notification-drawer__list-item-description">{description}</div>
    <div className="pf-c-notification-drawer__list-item-timestamp">
      {timestamp && <Timestamp simple timestamp={timestamp} />}
    </div>
  </li>
);

export type NotificationEntryProps = {
  actionText?: string;
  actionPath?: string;
  actionTestID?: string;
  description: React.ReactNode;
  isRead?: boolean;
  targetPath?: string;
  timestamp?: string;
  title: string;
  toggleNotificationDrawer?: () => any;
  type: NotificationTypes;
};

type NotificationIconTypes = {
  type: NotificationTypes;
};

type NotificationActionProps = {
  onClick: (event: React.MouseEvent<HTMLElement>) => void;
  text: string;
  path: string;
  dataTestID?: string;
};

export default NotificationEntry;
