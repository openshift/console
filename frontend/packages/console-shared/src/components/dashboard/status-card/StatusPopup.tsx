import * as React from 'react';

import './status-popup.scss';

export const StatusPopupSection: React.FC<StatusPopupSectionProps> = ({
  firstColumn,
  secondColumn,
  children,
}) => (
  <>
    <div className="co-status-popup__row co-status-popup__section">
      <div className="co-status-popup__text--bold">{firstColumn}</div>
      {secondColumn && <div className="text-secondary">{secondColumn}</div>}
    </div>
    {children}
  </>
);

const Status: React.FC<StatusProps> = ({ title, value, icon, children }) => (
  <div className="co-status-popup__row">
    {title || children}
    {!!value && (
      <div className="co-status-popup__status">
        <div className="text-secondary">{value}</div>
        <div className="co-status-popup__icon">{icon}</div>
      </div>
    )}
  </div>
);

type StatusProps = {
  title?: string;
  value?: string;
  icon?: React.ReactNode;
};

type StatusPopupSectionProps = {
  firstColumn: string;
  secondColumn?: string;
};

export default Status;
