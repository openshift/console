import type { FC, ReactNode } from 'react';
import './status-card.scss';

interface HealthBodyProps {
  children?: ReactNode;
}

const HealthBody: FC<HealthBodyProps> = ({ children }) => (
  <div className="co-status-card__health-body">{children}</div>
);

export default HealthBody;
