import * as React from 'react';

export const DetailsBody: React.FC<DetailsBodyProps> = ({ children }) => (
  <dl className="co-dashboard-card__body--top-margin co-details-card__body co-dashboard-text--small">
    {children}
  </dl>
);

type DetailsBodyProps = {
  children: React.ReactNode;
};
