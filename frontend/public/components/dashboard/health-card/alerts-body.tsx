import * as React from 'react';

export const AlertsBody: React.FC<AlertsBodyProps> = ({ children }) => (
  <div className="co-dashboard-card__body--no-padding co-health-card__alerts-body">{children}</div>
);

type AlertsBodyProps = {
  children: React.ReactNode[];
};
