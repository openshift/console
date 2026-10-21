import type { FC } from 'react';
import type {
  StatusPopupSectionProps,
  StatusPopupItemProps,
} from '@console/dynamic-plugin-sdk/src/extensions/dashboard-types';

import './status-popup.scss';

export const StatusPopupSection: FC<StatusPopupSectionProps> = ({
  firstColumn,
  secondColumn,
  children,
}) => (
  <>
    <div className="co-status-popup__row">
      <div className="co-status-popup__text--bold">{firstColumn}</div>
      {secondColumn && <div className="pf-v6-u-text-color-subtle">{secondColumn}</div>}
    </div>
    {children}
  </>
);

const Status: FC<StatusPopupItemProps> = ({ value, icon, children }) => (
  <div className="co-status-popup__row">
    {children}
    {(value || icon) && (
      <div className="co-status-popup__status">
        {value && <div className="pf-v6-u-text-color-subtle">{value}</div>}
        {icon && <div className="co-status-popup__icon">{icon}</div>}
      </div>
    )}
  </div>
);

export default Status;
