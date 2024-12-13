import * as React from 'react';
import * as classNames from 'classnames';
import { Badge } from '@patternfly/react-core';
import { AngleDownIcon, AngleRightIcon } from '@patternfly/react-icons';

const NotificationCategory: React.FC<NotificationCategoryProps> = ({
  label,
  count,
  isExpanded,
  children,
  onExpandContents,
}) => (
  <section
    className={classNames('query-pf-v5-c-notification-drawer__group', {
      'pf-m-expanded': isExpanded,
    })}
  >
    <button
      className="pf-v6-c-notification-drawer__group-toggle"
      aria-expanded={isExpanded}
      onClick={() => onExpandContents(!isExpanded)}
    >
      <div className="pf-v6-c-notification-drawer__group-toggle-title">{label}</div>
      <div className="pf-v6-c-notification-drawer__group-toggle-count">
        <Badge isRead>{count}</Badge>
      </div>
      <span className="pf-v6-c-notification-drawer__group-toggle-icon">
        {isExpanded ? <AngleDownIcon /> : <AngleRightIcon />}
      </span>
    </button>
    <ul className="pf-v6-c-notification-drawer__list" hidden={!isExpanded}>
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
