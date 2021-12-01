import * as React from 'react';
import {
  StatusPopupSectionProps,
  StatusPopupItemProps,
} from '@console/dynamic-plugin-sdk/src/extensions/dashboard-types';

import './status-popup.scss';

export const StatusPopupSection: React.FC<StatusPopupSectionProps> = ({
  firstColumn,
  secondColumn,
  children,
}) => (
  <>
    <div className="co-status-popup__row">
      <div className="co-status-popup__text--bold">{firstColumn}</div>
      {secondColumn && <div className="text-secondary">{secondColumn}</div>}
    </div>
    {children}
  </>
);

const Status: React.FC<StatusPopupItemProps> = ({ value, icon, children }) => (
  <div className="co-status-popup__row">
    {children}
    {(value || icon) && (
      <div className="co-status-popup__status">
        {value && <div className="text-secondary">{value}</div>}
        {icon && <div className="co-status-popup__icon">{icon}</div>}
      </div>
    )}
  </div>
);

export default Status;
