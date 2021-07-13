import * as React from 'react';
import './details-card.scss';
import { DetailsBodyProps } from '@console/dynamic-plugin-sdk/src/api/internal';

const DetailsBody: React.FC<DetailsBodyProps> = ({ children }) => (
  <dl className="co-dashboard-card__body--top-margin co-details-card__body co-dashboard-text--small">
    {children}
  </dl>
);

export default DetailsBody;
