import type { ReactNode } from 'react';
import './status-card.scss';

interface HealthBodyProps {
  children?: ReactNode;
}

const HealthBody: React.FCC<HealthBodyProps> = ({ children }) => (
  <div className="co-status-card__health-body">{children}</div>
);

export default HealthBody;
