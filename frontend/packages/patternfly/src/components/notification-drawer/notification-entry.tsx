import * as classNames from 'classnames';
import * as _ from 'lodash';
import * as React from 'react';
import { Link } from 'react-router-dom';
import {
  YellowExclamationTriangleIcon,
  GreenCheckCircleIcon,
  BlueInfoCircleIcon,
  RedExclamationCircleIcon,
} from '@console/shared';
import { ArrowCircleUpIcon } from '@patternfly/react-icons';
import { global_info_color_100 as blueInfoColor } from '@patternfly/react-tokens';
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
      return <ArrowCircleUpIcon color={blueInfoColor.value} />;
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

const NotificationEntry: React.FC<NotificationEntryProps> = ({
  title,
  description,
  isRead = false,
  timestamp,
  targetURL,
  toggleNotificationDrawer,
  type,
}) => {
  const notificationAction = type === NotificationTypes.update && targetURL && (
    <div className="pf-c-notification-drawer__header-action">
      <Link to="">Install Update</Link>
    </div>
  );
  return (
    <li
      className={classNames(`pf-c-notification-drawer__list-item pf-m-hoverable pf-m-${type}`, {
        'pf-m-read': isRead,
      })}
      tabIndex={0}
      onClick={
        targetURL
          ? () => {
              history.push(targetURL);
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
        {notificationAction}
      </div>
      <div className="pf-c-notification-drawer__list-item-description">{description}</div>
      <div className="pf-c-notification-drawer__list-item-timestamp">
        {timestamp && <Timestamp simple timestamp={timestamp} />}
      </div>
    </li>
  );
};

export type NotificationEntryProps = {
  title: string;
  description: string;
  isRead?: boolean;
  targetURL?: string;
  timestamp?: string;
  toggleNotificationDrawer?: () => any;
  type: NotificationTypes;
};

type NotificationIconTypes = {
  type: NotificationTypes;
};

export default NotificationEntry;
