import * as React from 'react';
import './status-card.scss';

interface HealthBodyProps {
  children?: React.ReactNode;
}

const HealthBody: React.FCC<HealthBodyProps> = ({ children }) => (
  <div className="co-status-card__health-body">{children}</div>
);

export default HealthBody;
