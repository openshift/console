import * as React from 'react';
import './details-card.scss';

const DetailsBody: React.FC<DetailsBodyProps> = ({ children }) => (
  <dl className="co-dashboard-card__body--top-margin co-details-card__body co-dashboard-text--small">
    {children}
  </dl>
);

export default DetailsBody;

type DetailsBodyProps = {
  children: React.ReactNode;
};
