import * as React from 'react';

export const AlertsBody: React.FC<AlertsBodyProps> = ({ children }) => (
  <div className="co-health-card__alerts-body">{children}</div>
);

type AlertsBodyProps = {
  children: React.ReactNode[];
};
