import * as React from 'react';

export const HealthBody: React.FC<{}> = ({ children }) => (
  <div className="co-dashboard-card__body--top-margin co-dashboard-card__body--bottom-margin co-status-card__health-body">
    {children}
  </div>
);
