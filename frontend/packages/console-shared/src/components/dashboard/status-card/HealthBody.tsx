import * as React from 'react';
import './status-card.scss';

const HealthBody: React.FC = ({ children }) => (
  <div className="co-status-card__health-body">{children}</div>
);

export default HealthBody;
