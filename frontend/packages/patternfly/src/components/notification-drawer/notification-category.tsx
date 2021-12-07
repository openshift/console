import * as React from 'react';
import classnames from 'classnames';
import { Badge } from '@patternfly/react-core';

const NotificationCategory: React.FC<NotificationCategoryProps> = ({
  label,
  count,
  isExpanded,
  children,
  onExpandContents,
}) => (
  <section
    className={classnames('query-pf-c-notification-drawer__group', {
      'pf-m-expanded': isExpanded,
    })}
  >
    <button
      className="pf-c-notification-drawer__group-toggle"
      aria-expanded={isExpanded}
      onClick={() => onExpandContents(!isExpanded)}
    >
      <div className="pf-c-notification-drawer__group-toggle-title">{label}</div>
      <div className="pf-c-notification-drawer__group-toggle-count">
        <Badge isRead>{count}</Badge>
      </div>
      <span className="pf-c-notification-drawer__group-toggle-icon">
        <i
          className={classnames({
            'fas fa-angle-down': isExpanded,
            'fas fa-angle-right': !isExpanded,
          })}
          aria-hidden={!isExpanded}
        />
      </span>
    </button>
    <ul className="pf-c-notification-drawer__list" hidden={!isExpanded}>
      {children}
    </ul>
  </section>
);

type NotificationCategoryProps = {
  children: React.ReactNode;
  count: number;
  isExpanded: boolean;
  label: string;
  onExpandContents: React.Dispatch<React.SetStateAction<boolean>>;
};

export default NotificationCategory;
